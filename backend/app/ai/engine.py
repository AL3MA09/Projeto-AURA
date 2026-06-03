"""
Motor principal de IA da AURA.
Orquestra: memória + RAG + LLM + fluxos acadêmicos.
"""
import time
from typing import AsyncGenerator, Optional
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.ai.system_prompt import AURA_SYSTEM_PROMPT
from app.ai.intent_classifier import classify_intent, IntentResult
from app.ai.memory import memory
from app.ai.rag import rag
from app.ai.flows import FlowHandler
from loguru import logger


class AuraEngine:
    def __init__(self):
        self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self._anthropic = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._flows = FlowHandler()

    async def chat(
        self,
        session_id: str,
        user_message: str,
        student_data: Optional[dict] = None,
        stream: bool = False,
    ) -> dict:
        start_time = time.monotonic()

        # 1. Classificar intenção
        intent: IntentResult = await classify_intent(user_message)
        logger.info(f"[{session_id}] Intent: {intent.intent} ({intent.confidence:.2f})")

        # 2. Verificar se há fluxo ativo em andamento
        ctx = await memory.get_context(session_id)
        active_flow = ctx.get("active_flow")

        if active_flow:
            response_text = await self._flows.continue_flow(
                session_id, active_flow, user_message, ctx
            )
        elif intent.intent in self._flows.handled_intents:
            response_text = await self._flows.start_flow(
                session_id, intent, user_message, student_data
            )
        else:
            # Resposta geral com RAG + LLM
            response_text = await self._generate_response(
                session_id, user_message, intent, student_data
            )

        # 3. Salvar na memória
        await memory.add_message(session_id, "user", user_message)
        await memory.add_message(session_id, "assistant", response_text)

        elapsed_ms = int((time.monotonic() - start_time) * 1000)

        return {
            "message": response_text,
            "intent": intent.intent,
            "confidence": intent.confidence,
            "entities": intent.entities,
            "processing_ms": elapsed_ms,
        }

    async def stream_chat(
        self,
        session_id: str,
        user_message: str,
        student_data: Optional[dict] = None,
    ) -> AsyncGenerator[str, None]:
        # Classificar e preparar contexto
        intent = await classify_intent(user_message)
        history = await memory.get_history_as_text(session_id)
        rag_context = await rag.format_context(user_message)
        student_str = self._format_student(student_data)

        system = AURA_SYSTEM_PROMPT.format(
            context=rag_context,
            history=history,
            student_data=student_str,
        )

        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ]

        full_response = ""
        stream = await self._openai.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=800,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            full_response += delta
            yield delta

        await memory.add_message(session_id, "user", user_message)
        await memory.add_message(session_id, "assistant", full_response)

    async def _generate_response(
        self,
        session_id: str,
        user_message: str,
        intent: IntentResult,
        student_data: Optional[dict],
    ) -> str:
        history = await memory.get_history_as_text(session_id)
        rag_context = await rag.format_context(user_message)
        student_str = self._format_student(student_data)

        system = AURA_SYSTEM_PROMPT.format(
            context=rag_context,
            history=history,
            student_data=student_str,
        )

        try:
            response = await self._openai.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.7,
                max_tokens=800,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI failed, falling back to Anthropic: {e}")
            return await self._anthropic_fallback(system, user_message)

    async def _anthropic_fallback(self, system: str, user_message: str) -> str:
        try:
            response = await self._anthropic.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=800,
                system=system,
                messages=[{"role": "user", "content": user_message}],
            )
            return response.content[0].text.strip()
        except Exception as e:
            logger.error(f"Anthropic fallback also failed: {e}")
            return (
                "Peço desculpas, estou com dificuldades técnicas no momento. "
                "Por favor, tente novamente em instantes ou entre em contato "
                "com a secretaria pelo telefone (11) 5686-6164."
            )

    def _format_student(self, student_data: Optional[dict]) -> str:
        if not student_data:
            return "Aluno não autenticado nesta sessão."
        return (
            f"Nome: {student_data.get('name', 'N/A')}\n"
            f"RA: {student_data.get('ra', 'N/A')}\n"
            f"Curso: {student_data.get('course', 'N/A')}\n"
            f"Semestre: {student_data.get('semester', 'N/A')}\n"
            f"Status: {'Matriculado' if student_data.get('is_enrolled') else 'Inativo'}"
        )


engine = AuraEngine()
