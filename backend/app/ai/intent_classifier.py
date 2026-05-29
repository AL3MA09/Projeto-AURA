import json
import re
from typing import Optional
from dataclasses import dataclass, field
from openai import AsyncOpenAI
from app.core.config import settings
from app.ai.system_prompt import AURA_INTENT_PROMPT
from loguru import logger


@dataclass
class IntentResult:
    intent: str
    confidence: float
    entities: dict = field(default_factory=dict)
    urgency: str = "low"


_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Regex fallback para intenções simples sem chamar a API
_INTENT_PATTERNS = {
    "enrollment_lock": [
        r"trancar?\s*(minha\s*)?matr[ií]cula",
        r"quero\s*trancar",
        r"trancamento",
    ],
    "document_request": [
        r"declara[çc][aã]o\s*(de\s*matr[ií]cula)?",
        r"hist[oó]rico\s*escolar",
        r"atestado",
        r"comprovante",
        r"preciso\s*(de\s*um?\s*)?(documento|papel|pdf)",
    ],
    "calendar": [
        r"calend[aá]rio",
        r"quando\s*(come[çc]am|s[aã]o|[eé])\s*(as?\s*)?(provas?|f[eé]rias?|matr[ií]cula)",
        r"data(s)?\s*(das?\s*)?provas?",
        r"pr[oó]xim[oa]\s*(prova|evento|aula)",
    ],
    "internship": [
        r"est[aá]gio\s*obrigat[oó]rio",
        r"como\s*funciona\s*(o\s*)?est[aá]gio",
        r"carga\s*hor[aá]ria\s*do\s*est[aá]gio",
        r"documentos?\s*para\s*est[aá]gio",
    ],
    "greeting": [
        r"^(ol[aá]|oi|bom\s*(dia|tarde|noite)|e\s*a[ií])[\s!]*$",
        r"^(hey|ei|aura)[\s!]*$",
    ],
    "farewell": [
        r"(tchau|at[eé]\s*logo|obrigad[ao]|valeu|at[eé]\s*mais)",
    ],
    "enrollment_transfer": [
        r"transfer[eê]ncia\s*(de\s*)?hor[aá]rio",
        r"mudar\s*(de\s*)?turma",
        r"trocar\s*(de\s*)?(hor[aá]rio|turma)",
    ],
    "professor_info": [
        r"professor\s*(de|do|da)",
        r"quem\s*(ministra|d[aá]\s*(aula|a\s*disciplina))",
        r"docente",
    ],
    "discipline_info": [
        r"disciplina",
        r"mat[eé]ria",
        r"ementa",
        r"grade\s*curricular",
    ],
}


def _regex_classify(text: str) -> Optional[str]:
    text_lower = text.lower().strip()
    for intent, patterns in _INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return intent
    return None


async def classify_intent(message: str) -> IntentResult:
    # Tenta classificação rápida por regex primeiro (zero latência)
    fast_intent = _regex_classify(message)

    try:
        prompt = AURA_INTENT_PROMPT.format(message=message)
        response = await _client.chat.completions.create(
            model="gpt-4o-mini",  # modelo rápido para classificação
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=300,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        data = json.loads(raw)

        return IntentResult(
            intent=data.get("intent", fast_intent or "unknown"),
            confidence=data.get("confidence", 0.85),
            entities=data.get("entities", {}),
            urgency=data.get("urgency", "low"),
        )
    except Exception as e:
        logger.warning(f"Intent classification API failed, using regex: {e}")
        return IntentResult(
            intent=fast_intent or "unknown",
            confidence=0.6 if fast_intent else 0.1,
        )
