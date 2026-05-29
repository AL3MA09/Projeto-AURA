from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator
from typing import List, Optional
import secrets


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "AURA - Assistente Universitário de Respostas Acadêmicas"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = secrets.token_urlsafe(32)
    API_V1_STR: str = "/api/v1"

    # ── CORS ──────────────────────────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://aura.fateczonasul.edu.br",
    ]

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://aura:aura_secret@localhost:5432/aura_db"
    DATABASE_SYNC_URL: str = "postgresql://aura:aura_secret@localhost:5432/aura_db"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL: int = 3600

    # ── JWT Auth ──────────────────────────────────────────────────────────────
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # ── AI / LLM ──────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-6"

    # ── ElevenLabs TTS ────────────────────────────────────────────────────────
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel - natural PT-BR
    ELEVENLABS_MODEL_ID: str = "eleven_multilingual_v2"

    # ── Azure TTS (fallback) ──────────────────────────────────────────────────
    AZURE_SPEECH_KEY: str = ""
    AZURE_SPEECH_REGION: str = "brazilsouth"
    AZURE_VOICE_NAME: str = "pt-BR-FranciscaNeural"

    # ── ChromaDB ──────────────────────────────────────────────────────────────
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION: str = "aura_knowledge"

    # ── Email ─────────────────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.fateczonasul.edu.br"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "aura@fateczonasul.edu.br"
    SMTP_FROM_NAME: str = "AURA - Secretaria FATEC Zona Sul"

    # ── FATEC Institucional ───────────────────────────────────────────────────
    FATEC_BASE_URL: str = "https://www.fateczonasul.edu.br"
    ARINTER_BASE_URL: str = "https://www.cpscetec.com.br/arinter"
    SCRAPER_INTERVAL_HOURS: int = 6

    # ── Security / LGPD ───────────────────────────────────────────────────────
    DATA_ENCRYPTION_KEY: str = secrets.token_urlsafe(32)
    LOG_SENSITIVE_DATA: bool = False
    AUDIT_LOG_ENABLED: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
