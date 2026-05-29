import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import Response

from app.voice.stt import stt
from app.voice.tts import tts
from app.voice.wake_word import detect_wake_word, extract_query_after_wake
from app.ai.engine import engine
from app.ai.memory import memory
from loguru import logger

router = APIRouter(prefix="/voice", tags=["Voice"])

ALLOWED_AUDIO_TYPES = {
    "audio/webm", "audio/ogg", "audio/wav", "audio/mpeg",
    "audio/mp4", "audio/x-m4a", "audio/flac",
}


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    detect_wake: bool = Form(False),
):
    """Transcreve áudio → texto usando Whisper."""
    if audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Formato de áudio não suportado: {audio.content_type}",
        )

    audio_bytes = await audio.read()
    if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=413, detail="Arquivo de áudio muito grande (máx. 25MB).")

    transcript = await stt.transcribe(audio_bytes, filename=audio.filename or "audio.webm")
    if not transcript:
        raise HTTPException(status_code=422, detail="Não foi possível transcrever o áudio.")

    result = {"transcript": transcript, "session_id": session_id}

    if detect_wake:
        wake_detected, clean_query = detect_wake_word(transcript)
        result["wake_detected"] = wake_detected
        result["clean_query"] = clean_query
    else:
        result["clean_query"] = transcript

    logger.info(f"Voice STT [{session_id or 'anon'}]: '{transcript[:80]}'")
    return result


@router.post("/synthesize")
async def synthesize_speech(
    text: str = Form(...),
    format: str = Form("mp3"),
):
    """Converte texto → áudio TTS."""
    if not text.strip():
        raise HTTPException(status_code=422, detail="Texto não pode ser vazio.")

    if len(text) > 5000:
        raise HTTPException(status_code=422, detail="Texto muito longo (máx. 5000 chars).")

    audio_bytes = await tts.synthesize(text, output_format=format)
    if not audio_bytes:
        raise HTTPException(status_code=503, detail="Serviço de TTS indisponível no momento.")

    media_type = "audio/mpeg" if format == "mp3" else "audio/wav"
    return Response(content=audio_bytes, media_type=media_type)


@router.post("/process")
async def process_voice_message(
    audio: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    synthesize_response: bool = Form(True),
):
    """
    Pipeline completo de voz:
    Áudio → STT → LLM → TTS → Resposta em áudio.
    """
    session_id = session_id or str(uuid.uuid4())

    # 1. STT
    audio_bytes = await audio.read()
    transcript = await stt.transcribe(audio_bytes, filename=audio.filename or "audio.webm")
    if not transcript:
        raise HTTPException(status_code=422, detail="Não consegui entender o áudio. Tente novamente.")

    # 2. Wake word
    _, clean_query = detect_wake_word(transcript)
    query = clean_query or transcript

    # 3. AI
    ctx = await memory.get_context(session_id)
    student_data = ctx.get("student_data")
    result = await engine.chat(session_id=session_id, user_message=query, student_data=student_data)

    response_text = result["message"]

    # 4. TTS (opcional)
    audio_response = None
    if synthesize_response:
        audio_response = await tts.synthesize_base64(response_text)

    return {
        "session_id": session_id,
        "transcript": transcript,
        "query": query,
        "response": response_text,
        "intent": result["intent"],
        "processing_ms": result["processing_ms"],
        "audio_base64": audio_response,
        "audio_format": "mp3",
    }


@router.post("/wake-word/detect")
async def detect_wake_word_endpoint(text: str = Form(...)):
    """Detecta wake word em texto já transcrito (para uso client-side)."""
    detected, clean_query = detect_wake_word(text)
    return {"detected": detected, "clean_query": clean_query, "original": text}
