import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.ai.engine import engine
from app.ai.memory import memory
from app.core.security import create_access_token
from loguru import logger

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseModel):
    session_id: str
    message: str
    intent: str
    confidence: float
    processing_ms: int
    authenticated: bool = False


@router.post("/message", response_model=ChatResponse)
async def send_message(
    req: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    session_id = req.session_id or str(uuid.uuid4())

    if not req.message.strip():
        raise HTTPException(status_code=422, detail="Mensagem não pode ser vazia.")

    if len(req.message) > 2000:
        raise HTTPException(status_code=422, detail="Mensagem muito longa (máx. 2000 caracteres).")

    # Recuperar contexto e dados do aluno autenticado
    ctx = await memory.get_context(session_id)
    student_data = ctx.get("student_data")

    logger.info(f"Chat [{session_id[:8]}]: '{req.message[:60]}...'")

    result = await engine.chat(
        session_id=session_id,
        user_message=req.message,
        student_data=student_data,
    )

    is_authenticated = await memory.is_authenticated(session_id)

    return ChatResponse(
        session_id=session_id,
        message=result["message"],
        intent=result["intent"],
        confidence=result["confidence"],
        processing_ms=result["processing_ms"],
        authenticated=is_authenticated,
    )


@router.post("/stream")
async def stream_message(req: ChatRequest):
    session_id = req.session_id or str(uuid.uuid4())
    ctx = await memory.get_context(session_id)
    student_data = ctx.get("student_data")

    async def event_generator():
        yield f"data: {{\"session_id\": \"{session_id}\"}}\n\n"
        async for chunk in engine.stream_chat(
            session_id=session_id,
            user_message=req.message,
            student_data=student_data,
        ):
            escaped = chunk.replace('"', '\\"').replace("\n", "\\n")
            yield f"data: {{\"chunk\": \"{escaped}\"}}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/{session_id}")
async def get_history(session_id: str):
    history = await memory.get_history_as_text(session_id)
    ctx = await memory.get_context(session_id)
    return {
        "session_id": session_id,
        "history": history,
        "context": {k: v for k, v in ctx.items() if k != "student_data"},
    }


@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    await memory.clear_session(session_id)
    return {"message": "Sessão encerrada.", "session_id": session_id}


@router.post("/new-session")
async def new_session():
    session_id = str(uuid.uuid4())
    return {"session_id": session_id}
