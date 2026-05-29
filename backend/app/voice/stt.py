"""
Speech-to-Text da AURA usando OpenAI Whisper.
Suporta upload de áudio e transcrição em tempo real.
"""
import io
import tempfile
import os
from typing import Optional
from openai import AsyncOpenAI
from app.core.config import settings
from loguru import logger


class AuraSTT:
    def __init__(self):
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def transcribe(
        self,
        audio_bytes: bytes,
        filename: str = "audio.webm",
        language: str = "pt",
    ) -> Optional[str]:
        """
        Transcreve áudio para texto usando Whisper.
        Aceita formatos: webm, mp3, wav, ogg, m4a, flac.
        """
        try:
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename

            response = await self._client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="json",
                prompt=(
                    "Este é um áudio de um aluno universitário falando em português brasileiro "
                    "com a assistente virtual da FATEC Zona Sul. "
                    "Termos comuns: RA, CPF, matrícula, trancamento, histórico escolar, estágio."
                ),
            )
            text = response.text.strip()
            logger.info(f"STT transcribed: '{text[:80]}...' ({len(audio_bytes)} bytes)")
            return text
        except Exception as e:
            logger.error(f"STT transcription failed: {e}")
            return None

    async def transcribe_stream(self, audio_chunks: list[bytes]) -> Optional[str]:
        """Transcreve múltiplos chunks de áudio concatenados."""
        combined = b"".join(audio_chunks)
        return await self.transcribe(combined)


stt = AuraSTT()
