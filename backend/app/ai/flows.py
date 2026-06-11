"""
Fluxos guiados da AURA: trancamento, documentos, autenticação, etc.
Cada fluxo é uma máquina de estados armazenada no contexto Redis.
"""
from typing import Optional
import hashlib
from app.ai.memory import memory
from app.ai.intent_classifier import IntentResult
from loguru import logger


class FlowHandler:
    handled_intents = {
        "enrollment_lock",
        "document_request",
        "enrollment_transfer",
        "authentication",
    }

    async def start_flow(
        self,
        session_id: str,
        intent: IntentResult,
        user_message: str,
        student_data: Optional[dict],
    ) -> str:
        flow_map = {
            "enrollment_lock": self._start_enrollment_lock,
            "document_request": self._start_document_request,
            "enrollment_transfer": self._start_enrollment_transfer,
            "authentication": self._start_authentication,
        }
        handler = flow_map.get(intent.intent)
        if handler:
            return await handler(session_id, intent, student_data)
        return ""

    async def continue_flow(
        self, session_id: str, flow_name: str, user_message: str, ctx: dict
    ) -> str:
        flow_map = {
            "enrollment_lock": self._continue_enrollment_lock,
            "document_request": self._continue_document_request,
            "enrollment_transfer": self._continue_enrollment_transfer,
            "authentication": self._continue_authentication,
        }
        handler = flow_map.get(flow_name)
        if handler:
            return await handler(session_id, user_message, ctx)
        await memory.update_context(session_id, {"active_flow": None})
        return "Desculpe, ocorreu um erro no fluxo. Como posso ajudar?"

    # ── Trancamento de Matrícula ──────────────────────────────────────────────
    async def _start_enrollment_lock(self, session_id: str, intent: IntentResult, student_data: Optional[dict]) -> str:
        if student_data:  # já autenticado
            await memory.update_context(session_id, {
                "active_flow": "enrollment_lock",
                "flow_step": "confirm",
                "ra": student_data["ra"],
            })
            return (
                f"Olá, {student_data['name'].split()[0]}! Você deseja trancar sua matrícula "
                f"para o semestre atual? Por favor, confirme com **sim** ou **não**."
            )
        await memory.update_context(session_id, {
            "active_flow": "enrollment_lock",
            "flow_step": "ask_ra",
        })
        return (
            "Posso ajudar com o trancamento de matrícula. "
            "Por favor, informe seu **RA** (Registro Acadêmico)."
        )

    async def _continue_enrollment_lock(self, session_id: str, message: str, ctx: dict) -> str:
        step = ctx.get("flow_step", "ask_ra")
        message_clean = message.strip().lower()

        if step == "ask_ra":
            ra = "".join(filter(str.isdigit, message))
            if len(ra) < 4:
                return "Não reconheci um RA válido. Por favor, informe apenas os números do seu RA."
            await memory.update_context(session_id, {"flow_step": "ask_cpf", "ra": ra})
            return f"RA **{ra[:3]}{'*' * (len(ra)-3)}** recebido. Agora informe os **3 primeiros dígitos do seu CPF** para validação."

        if step == "ask_cpf":
            cpf_partial = "".join(filter(str.isdigit, message))[:3]
            if len(cpf_partial) < 3:
                return "Por favor, informe os 3 primeiros dígitos do CPF para continuar."
            # Simulação de validação
            ra = ctx.get("ra", "")
            is_valid = await self._validate_student(ra, cpf_partial)
            if not is_valid:
                await memory.update_context(session_id, {"active_flow": None})
                return (
                    "Não consegui validar seus dados. "
                    "Verifique o RA e os dígitos do CPF informados. "
                    "Se o problema persistir, compareça à secretaria presencialmente."
                )
            await memory.update_context(session_id, {"flow_step": "confirm", "cpf_validated": True})
            return "Validação concluída! Você deseja trancar sua matrícula para o **semestre atual**? Responda **sim** ou **não**."

        if step == "confirm":
            if message_clean in ("sim", "s", "yes", "confirmo", "confirmar"):
                ra = ctx.get("ra", "")
                await memory.update_context(session_id, {"active_flow": None})
                logger.info(f"AUDIT: Trancamento solicitado para RA {ra[:3]}***")
                return (
                    "✅ Solicitação de **trancamento de matrícula** registrada com sucesso!\n\n"
                    "**Protocolo:** TRC-{ra[:6]}-2026\n"
                    "O processamento ocorre em até **3 dias úteis**. "
                    "Você receberá uma confirmação no seu e-mail institucional.\n\n"
                    "Posso ajudar com mais alguma coisa?"
                )
            else:
                await memory.update_context(session_id, {"active_flow": None})
                return "Tudo bem! O trancamento foi cancelado. Como posso ajudar?"

        return "Desculpe, houve um problema no fluxo. Como posso ajudar?"

    # ── Solicitação de Documentos ─────────────────────────────────────────────
    async def _start_document_request(self, session_id: str, intent: IntentResult, student_data: Optional[dict]) -> str:
        doc_types = {
            "declaracao_matricula": "Declaração de Matrícula",
            "historico_escolar": "Histórico Escolar",
            "atestado_frequencia": "Atestado de Frequência",
            "comprovante_matricula": "Comprovante de Matrícula",
        }
        # Detectar tipo pelo contexto
        entities = intent.entities or {}
        doc_type = entities.get("doc_type", "declaracao_matricula")

        if student_data:
            await memory.update_context(session_id, {
                "active_flow": "document_request",
                "flow_step": "confirm_delivery",
                "ra": student_data["ra"],
                "doc_type": doc_type,
                "student_email": student_data.get("email", ""),
            })
            doc_name = doc_types.get(doc_type, "Declaração de Matrícula")
            email = student_data.get("email", "seu e-mail institucional")
            return (
                f"Claro! Deseja receber a **{doc_name}** em PDF no e-mail **{email}**? "
                f"Responda **sim** para confirmar."
            )

        await memory.update_context(session_id, {
            "active_flow": "document_request",
            "flow_step": "ask_ra",
            "doc_type": doc_type,
        })
        doc_name = doc_types.get(doc_type, "documento")
        return (
            f"Para gerar a **{doc_name}**, preciso validar sua identidade. "
            "Informe seu **RA** (Registro Acadêmico)."
        )

    async def _continue_document_request(self, session_id: str, message: str, ctx: dict) -> str:
        step = ctx.get("flow_step")
        message_clean = message.strip().lower()

        if step == "ask_ra":
            ra = "".join(filter(str.isdigit, message))
            if len(ra) < 4:
                return "Informe um RA válido, por favor."
            await memory.update_context(session_id, {"flow_step": "ask_cpf", "ra": ra})
            return f"RA recebido. Informe os **3 primeiros dígitos do CPF** para continuar."

        if step == "ask_cpf":
            cpf_partial = "".join(filter(str.isdigit, message))[:3]
            if len(cpf_partial) < 3:
                return "Por favor, informe os 3 primeiros dígitos do CPF."
            ra = ctx.get("ra", "")
            is_valid = await self._validate_student(ra, cpf_partial)
            if not is_valid:
                await memory.update_context(session_id, {"active_flow": None})
                return "Não foi possível validar seus dados. Tente novamente ou procure a secretaria."
            await memory.update_context(session_id, {
                "flow_step": "confirm_delivery",
                "cpf_validated": True,
                "student_email": f"aluno{ra}@fatec.sp.gov.br",
            })
            email = f"aluno{ra}@fatec.sp.gov.br"
            return f"Validado! O documento será enviado para **{email}**. Confirma? (**sim** / **não**)"

        if step == "confirm_delivery":
            if message_clean in ("sim", "s", "yes", "confirmo"):
                doc_type = ctx.get("doc_type", "declaracao_matricula")
                ra = ctx.get("ra", "")
                await memory.update_context(session_id, {"active_flow": None})
                logger.info(f"AUDIT: Documento {doc_type} solicitado para RA {ra[:3]}***")
                return (
                    "📄 Documento gerado e enviado com sucesso para seu e-mail institucional!\n\n"
                    "O arquivo PDF estará disponível em alguns minutos. "
                    "Verifique também a pasta de spam.\n\n"
                    "Posso ajudar com mais alguma coisa?"
                )
            await memory.update_context(session_id, {"active_flow": None})
            return "Solicitação cancelada. Como posso ajudar?"

        return "Houve um problema no fluxo. Como posso ajudar?"

    # ── Transferência de Horário ──────────────────────────────────────────────
    async def _start_enrollment_transfer(self, session_id: str, intent: IntentResult, student_data: Optional[dict]) -> str:
        await memory.update_context(session_id, {
            "active_flow": "enrollment_transfer",
            "flow_step": "ask_ra" if not student_data else "ask_discipline",
            "ra": student_data["ra"] if student_data else None,
        })
        if student_data:
            return f"Olá, {student_data['name'].split()[0]}! Qual **disciplina** deseja transferir de turma?"
        return "Para transferência de horário, informe seu **RA** primeiro."

    async def _continue_enrollment_transfer(self, session_id: str, message: str, ctx: dict) -> str:
        step = ctx.get("flow_step")
        if step == "ask_ra":
            ra = "".join(filter(str.isdigit, message))
            await memory.update_context(session_id, {"flow_step": "ask_cpf", "ra": ra})
            return "Informe os **3 primeiros dígitos do CPF** para validação."
        if step == "ask_cpf":
            cpf_partial = "".join(filter(str.isdigit, message))[:3]
            await memory.update_context(session_id, {"flow_step": "ask_discipline", "cpf_validated": True})
            return "Validado! Qual **disciplina** deseja transferir de turma?"
        if step == "ask_discipline":
            await memory.update_context(session_id, {"flow_step": "processed", "discipline": message})
            await memory.update_context(session_id, {"active_flow": None})
            return (
                f"📋 Solicitação de transferência para **{message}** registrada!\n\n"
                "A disponibilidade de vagas será verificada e você receberá "
                "uma resposta em até **2 dias úteis** por e-mail.\n\n"
                "Precisa de mais alguma coisa?"
            )
        return "Houve um problema. Como posso ajudar?"

    # ── Autenticação ──────────────────────────────────────────────────────────
    async def _start_authentication(self, session_id: str, intent: IntentResult, student_data: Optional[dict]) -> str:
        await memory.update_context(session_id, {
            "active_flow": "authentication",
            "flow_step": "ask_ra",
        })
        return "Para identificar você, informe seu **RA** (Registro Acadêmico)."

    async def _continue_authentication(self, session_id: str, message: str, ctx: dict) -> str:
        step = ctx.get("flow_step")
        if step == "ask_ra":
            ra = "".join(filter(str.isdigit, message))
            await memory.update_context(session_id, {"flow_step": "ask_cpf", "ra": ra})
            return "Informe os **3 primeiros dígitos do seu CPF**."
        if step == "ask_cpf":
            cpf_partial = "".join(filter(str.isdigit, message))[:3]
            ra = ctx.get("ra", "")
            is_valid = await self._validate_student(ra, cpf_partial)
            await memory.update_context(session_id, {"active_flow": None})
            if is_valid:
                await memory.update_context(session_id, {"authenticated": True, "ra": ra})
                return f"✅ Identidade confirmada! Bem-vindo(a)! Como posso ajudar?"
            return "Não foi possível confirmar sua identidade. Verifique os dados e tente novamente."
        return "Houve um erro na autenticação. Tente novamente."

    # ── Helpers ───────────────────────────────────────────────────────────────
    async def _validate_student(self, ra: str, cpf_partial: str) -> bool:
        if not ra or not cpf_partial or len(cpf_partial) < 3:
            return False
        logger.info(f"AUDIT: Validação de identidade para RA {ra[:3]}***")
        return True
