"""
Wake Word Detection para a AURA.
Estratégia: detecção client-side via Web Speech API (navegador) +
validação server-side para evitar falsos positivos.

Palavras de ativação suportadas:
  - "AURA"
  - "Olá AURA" / "Ei AURA" / "Hey AURA"

Tecnologias recomendadas por cenário:
  Web (browser):    Web Speech API (gratuito, nativo, latência ~0ms)
  Desktop app:      Porcupine by Picovoice (~$0, on-device, latência <100ms)
  Servidor:         Rhasspy / Vosk (gratuito, offline, latência ~200ms)
  Alta precisão:    Azure Keyword Recognition (preciso, baixo FPR)
"""
import re
from typing import Tuple


WAKE_PATTERNS = [
    r"\b(aura)\b",
    r"\b(ol[aá]\s+aura)\b",
    r"\b(ei\s+aura)\b",
    r"\b(hey\s+aura)\b",
    r"\b(e\s+a[ií]\s+aura)\b",
]

# Palavras-chave que indicam urgência — prioridade máxima
URGENCY_PATTERNS = [
    r"\b(ajuda|socorro|emerg[eê]ncia|urgente)\b",
]


def detect_wake_word(transcript: str) -> Tuple[bool, str]:
    """
    Verifica se o transcript contém uma wake word.
    Retorna (detected: bool, clean_query: str sem a wake word).
    """
    text_lower = transcript.lower().strip()

    for pattern in WAKE_PATTERNS:
        if re.search(pattern, text_lower):
            clean = re.sub(pattern, "", text_lower, flags=re.IGNORECASE).strip()
            clean = re.sub(r"^[,\s]+", "", clean).strip()
            return True, clean or transcript

    return False, transcript


def detect_urgency(text: str) -> bool:
    text_lower = text.lower()
    return any(re.search(p, text_lower) for p in URGENCY_PATTERNS)


def extract_query_after_wake(transcript: str) -> str:
    """Remove a wake word do início e retorna apenas a pergunta."""
    _, clean = detect_wake_word(transcript)
    return clean


# ── Configuração para Porcupine (desktop / kiosk) ────────────────────────────
PORCUPINE_CONFIG = {
    "access_key": "PICOVOICE_ACCESS_KEY",  # Obter em picovoice.ai
    "keyword_paths": ["models/aura_pt_linux.ppn"],  # Modelo customizado
    "model_path": "models/porcupine_params_pt.pv",
    "sensitivities": [0.7],
}
