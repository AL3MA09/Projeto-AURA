from fastapi import APIRouter
from app.api.v1.endpoints import chat, voice, academic, auth

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(chat.router)
api_router.include_router(voice.router)
api_router.include_router(academic.router)
