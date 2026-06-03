"""
Text-to-Speech da AURA.
Prioridade:
  1. ElevenLabs (melhor qualidade, latência ~300ms)
  2. Azure Neural TTS (fallback, PT-BR-FranciscaNeural)
  3. OpenAI TTS (fallback secundário)

Comparativo de tecnologias:
  ElevenLabs   → Qualidade premium, $0.30/1k chars, latência ~300ms
  Azure Neural → Qualidade alta, $16/1M chars, latência ~200ms, mais barato
  OpenAI TTS   → Qualidade boa, $15/1M chars, modelos alloy/nova/shimmer
  Coqui XTTS   → Gratuito, on-premise, latência ~800ms, qualidade boa
"""
import io
import base64
from typing import Optional
import httpx
from openai import AsyncOpenAI
from elevenlabs.client import AsyncElevenLabs
from app.core.config import settings
from loguru import logger


class AuraTTS:
    def __init__(self):
        self._eleven = AsyncElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        self._openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def synthesize(self, text: str, output_format: str = "mp3") -> Optional[bytes]:
        """Sintetiza texto em áudio. Retorna bytes do arquivo de áudio."""
        # Remove markdown que soa mal em TTS
        clean_text = self._clean_for_tts(text)

        audio = await self._try_elevenlabs(clean_text)
        if audio:
            return audio

        audio = await self._try_azure(clean_text)
        if audio:
            return audio

        audio = await self._try_openai(clean_text)
        return audio

    async def synthesize_base64(self, text: str) -> Optional[str]:
        """Retorna áudio como base64 para envio via API."""
        audio_bytes = await self.synthesize(text)
        if audio_bytes:
            return base64.b64encode(audio_bytes).decode("utf-8")
        return None

    async def _try_elevenlabs(self, text: str) -> Optional[bytes]:
        if not settings.ELEVENLABS_API_KEY:
            return None
        try:
            audio_stream = self._eleven.text_to_speech.convert(
                voice_id=settings.ELEVENLABS_VOICE_ID,
                text=text,
                model_id=settings.ELEVENLABS_MODEL_ID,
                output_format="mp3_44100_128",
            )
            chunks = []
            async for chunk in audio_stream:
                if chunk:
                    chunks.append(chunk)
            audio = b"".join(chunks)
            logger.debug(f"ElevenLabs TTS: {len(text)} chars → {len(audio)} bytes")
            return audio
        except Exception as e:
            logger.warning(f"ElevenLabs TTS failed: {e}")
            return None

    async def _try_azure(self, text: str) -> Optional[bytes]:
        if not settings.AZURE_SPEECH_KEY:
            return None
        try:
            ssml = f"""<speak version='1.0' xml:lang='pt-BR'>
  <voice name='{settings.AZURE_VOICE_NAME}'>
    <prosody rate='0%' pitch='0%'>{text}</prosody>
  </voice>
</speak>"""
            endpoint = (
                f"https://{settings.AZURE_SPEECH_REGION}.tts.speech.microsoft.com"
                "/cognitiveservices/v1"
            )
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    endpoint,
                    headers={
                        "Ocp-Apim-Subscription-Key": settings.AZURE_SPEECH_KEY,
                        "Content-Type": "application/ssml+xml",
                        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
                    },
                    content=ssml.encode("utf-8"),
                )
                if response.status_code == 200:
                    logger.debug(f"Azure TTS: {len(text)} chars → {len(response.content)} bytes")
                    return response.content
            return None
        except Exception as e:
            logger.warning(f"Azure TTS failed: {e}")
            return None

    async def _try_openai(self, text: str) -> Optional[bytes]:
        if not settings.OPENAI_API_KEY:
            return None
        try:
            response = await self._openai.audio.speech.create(
                model="tts-1-hd",
                voice="nova",  # Nova soa mais natural em PT-BR
                input=text,
                response_format="mp3",
            )
            audio = response.read()
            logger.debug(f"OpenAI TTS: {len(text)} chars → {len(audio)} bytes")
            return audio
        except Exception as e:
            logger.error(f"OpenAI TTS failed: {e}")
            return None

    def _clean_for_tts(self, text: str) -> str:
        import re
        # Remove markdown
        text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
        text = re.sub(r"\*(.*?)\*", r"\1", text)
        text = re.sub(r"#{1,6}\s+", "", text)
        text = re.sub(r"`(.*?)`", r"\1", text)
        text = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text)
        # Substitui emojis e símbolos problemáticos
        text = text.replace("✅", "").replace("📄", "").replace("📋", "")
        text = text.replace("\n\n", ". ").replace("\n", ", ")
        return text.strip()


tts = AuraTTS()
