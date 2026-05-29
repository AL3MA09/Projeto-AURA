"""
Script de seed da base de conhecimento da AURA.
Popula o ChromaDB com informações institucionais estáticas da FATEC Zona Sul.
Execute após iniciar os serviços: python scripts/seed_knowledge.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.chdir(os.path.join(os.path.dirname(__file__), ".."))

from backend.app.ai.rag import rag
from langchain_core.documents import Document


KNOWLEDGE_BASE = [
    {
        "title": "Informações Gerais da FATEC Zona Sul",
        "content": """
A FATEC Zona Sul (Faculdade de Tecnologia da Zona Sul) é uma instituição pública de ensino superior
tecnológico localizada em São Paulo, SP. Faz parte do Centro Paula Souza.

Endereço: Av. Paulistano, 600 — Jardim Miriam, São Paulo - SP, CEP 04677-000
Telefone: (11) 5686-6164
Email: secretaria@fateczonasul.edu.br
Site: https://www.fateczonasul.edu.br

Horário de atendimento da secretaria:
- Segunda a Sexta: 8h às 12h e 13h às 22h
- Sábados: 8h às 12h (quando há aulas)

Cursos disponíveis:
- Análise e Desenvolvimento de Sistemas (ADS) — 6 semestres
- Gestão de Tecnologia da Informação (GTI) — 6 semestres
- Logística — 6 semestres
- Marketing — 6 semestres
- Manutenção de Aeronaves — 6 semestres
""",
        "category": "institucional",
        "tags": ["fatec", "endereco", "horario", "cursos", "contato"],
    },
    {
        "title": "Processo de Matrícula e Rematrícula",
        "content": """
MATRÍCULA INICIAL:
- Realizada após aprovação no vestibular da FATEC
- Documentos necessários: RG, CPF, comprovante de residência, certificado de conclusão do EM
- Prazo: conforme edital do vestibular

REMATRÍCULA (alunos regulares):
- Realizada semestralmente no período definido no calendário acadêmico
- Feita online pelo portal do aluno: fateczonasul.edu.br/aluno
- Aluno deve estar sem pendências financeiras e acadêmicas
- A não realização da rematrícula implica em abandono de curso

TRANCAMENTO DE MATRÍCULA:
- Permitido a partir do 2º semestre do curso
- Prazo: até 30 dias após o início do semestre
- Máximo de 4 semestres trancados durante o curso
- Solicitação via secretaria (presencial ou pelo chat da AURA)
- Documentação: formulário + RA + validação de identidade

TRANSFERÊNCIA DE HORÁRIO/TURMA:
- Sujeito a disponibilidade de vagas
- Solicitação em até 30 dias após o início do semestre
- Aprovação pela coordenação do curso
""",
        "category": "matricula",
        "tags": ["matricula", "rematricula", "trancamento", "transferencia"],
    },
    {
        "title": "Estágio Obrigatório — Regras e Procedimentos",
        "content": """
O estágio obrigatório da FATEC Zona Sul é regulamentado pela Lei Federal 11.788/2008
e pelas normas internas do Centro Paula Souza.

REQUISITOS GERAIS:
- Empresa com CNPJ ativo e atuação compatível com o curso
- Supervisão por profissional da área
- Carga horária mínima: 400 horas (verificar com coordenação do curso específico)
- Pode ser remunerado (bolsa auxílio) ou não remunerado

DOCUMENTAÇÃO NECESSÁRIA:
1. Plano de Atividades — assinado pela empresa e pelo aluno
2. Termo de Compromisso de Estágio (TCE) — 3 vias
3. Apólice de seguro contra acidentes pessoais
4. Carta de apresentação da empresa

PRAZO DE ENTREGA:
- No mínimo 10 dias úteis antes do início do estágio
- Entregar na secretaria ou pelo formulário online

ACOMPANHAMENTO:
- Relatório parcial: ao fim do primeiro terço da carga horária
- Relatório final: ao término do estágio (prazo: 30 dias após conclusão)
- Avaliação pelo supervisor da empresa e pelo orientador da FATEC

INTERCÂMBIO INTERNACIONAL (ARINTER):
- Programas disponíveis: Mobilidade Estudantil Internacional
- Consultar editais em: cpscetec.com.br/arinter
- Bolsas parciais e integrais disponíveis em programas específicos
""",
        "category": "estagio",
        "tags": ["estagio", "obrigatorio", "lei", "documentacao", "arinter", "intercambio"],
    },
    {
        "title": "Documentos Acadêmicos — Como Solicitar",
        "content": """
A FATEC Zona Sul oferece os seguintes documentos acadêmicos:

1. DECLARAÇÃO DE MATRÍCULA
   - Comprova que o aluno está regularmente matriculado
   - Emissão: imediata pelo portal do aluno ou via AURA
   - Formato: PDF com assinatura digital
   - Validade: 90 dias da emissão

2. HISTÓRICO ESCOLAR
   - Lista todas as disciplinas cursadas com notas e situação
   - Emissão: até 2 dias úteis
   - Formato: PDF com QR code de autenticidade

3. ATESTADO DE FREQUÊNCIA
   - Comprova frequência em disciplinas específicas
   - Prazo: até 3 dias úteis
   - Requer justificativa de uso

4. COMPROVANTE DE MATRÍCULA
   - Documento resumido para uso em programas externos
   - Emissão: imediata

COMO SOLICITAR VIA AURA:
1. Informe seu RA
2. Valide com os 3 primeiros dígitos do CPF
3. Escolha o documento desejado
4. Informe se deseja receber por e-mail institucional
5. Documento enviado em até 2 minutos (declaração) ou dias úteis (demais)

COMO SOLICITAR PRESENCIALMENTE:
- Compareça à secretaria com RG e RA
- Horário: Seg a Sex, 8h–12h e 13h–22h
""",
        "category": "documentos",
        "tags": ["declaracao", "historico", "atestado", "comprovante", "documento"],
    },
    {
        "title": "Calendário Acadêmico 2026",
        "content": """
CALENDÁRIO ACADÊMICO 2026 — FATEC ZONA SUL

1º SEMESTRE 2026:
- 02/02/2026: Início das aulas
- 16-17/02/2026: Carnaval — Recesso
- Março: Período de rematrícula fora de prazo
- 06/04/2026: 1ª Prova Bimestral (PB1)
- 21/04/2026: Tiradentes — Feriado
- 01/05/2026: Dia do Trabalho — Feriado
- 25/05/2026: 2ª Prova Bimestral (PB2)
- 07/06/2026: Corpus Christi — Feriado
- 04/07/2026: Encerramento do 1º Semestre
- 07-26/07/2026: Recesso Escolar (Julho)

2º SEMESTRE 2026:
- 27/07/2026: Início das aulas
- 07/09/2026: Independência — Feriado
- 07/09/2026: 1ª Prova Bimestral (PB1)
- 12/10/2026: N. Sra. Aparecida — Feriado
- 09/11/2026: 2ª Prova Bimestral (PB2)
- 15/11/2026: Proclamação da República — Feriado
- 20/11/2026: Consciência Negra — Feriado
- 23-27/11/2026: Período de rematrícula 2027.1
- 12/12/2026: Encerramento do Ano Letivo

OBSERVAÇÕES:
- Datas sujeitas a alterações conforme resolução do Centro Paula Souza
- Feriados municipais podem alterar o calendário
- Consultar sempre o site oficial: fateczonasul.edu.br
""",
        "category": "calendario",
        "tags": ["calendario", "provas", "ferias", "feriados", "matricula", "datas", "2026"],
    },
    {
        "title": "Sistema de Avaliação e Aprovação",
        "content": """
CRITÉRIOS DE APROVAÇÃO NA FATEC ZONA SUL:

NOTAS:
- 2 Provas Bimestrais por semestre (PB1 e PB2)
- Nota de cada PB: 0 a 10
- Média mínima para aprovação: 5,0 (PB1 + PB2) / 2
- Algumas disciplinas possuem trabalhos e atividades práticas

FREQUÊNCIA:
- Mínimo de 75% de presença obrigatória em cada disciplina
- Falta à prova: nota 0,0, salvo justificativa aceita pela coordenação
- Abono de falta: apenas para situações previstas em lei (serviço militar, internação, etc.)

SEGUNDA CHAMADA:
- Aluno com falta justificada na prova pode solicitar 2ª chamada
- Prazo: até 3 dias úteis após a realização da prova original
- Formulário disponível na secretaria

EXAME FINAL (EF):
- Para médias entre 3,0 e 4,9
- Nota mínima no EF para aprovação: 5,0
- Média final aprovação: (média semestral + EF) / 2 ≥ 5,0
""",
        "category": "academico",
        "tags": ["notas", "aprovacao", "frequencia", "prova", "exame", "avaliacao"],
    },
]


async def seed():
    print("Inicializando RAG/ChromaDB...")
    await rag.initialize()

    docs = [
        Document(
            page_content=f"{item['title']}\n\n{item['content']}",
            metadata={
                "title": item["title"],
                "category": item["category"],
                "tags": ",".join(item["tags"]),
                "source": "knowledge_base_seed",
            },
        )
        for item in KNOWLEDGE_BASE
    ]

    print(f"Adicionando {len(docs)} documentos ao RAG...")
    await rag.add_documents(docs)
    print("✅ Base de conhecimento populada com sucesso!")
    print(f"   {len(docs)} documentos indexados no ChromaDB")


if __name__ == "__main__":
    asyncio.run(seed())
