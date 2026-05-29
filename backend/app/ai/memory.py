"""
Memória conversacional da AURA com dois níveis:
  - Curto prazo: Redis (TTL 2h por sessão)
  - Longo prazo: ChromaDB (histórico semântico do aluno)
"""
from typing import List, Optional
import json
from redis import asyncio as aioredis
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from app.core.config import settings
from loguru import logger


class ConversationMemory:
    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if not self._redis:
            self._redis = await aioredis.from_url(
                settings.REDIS_URL, encoding="utf-8", decode_responses=True
            )
        return self._redis

    def _session_key(self, session_id: str) -> str:
        return f"aura:session:{session_id}:messages"

    def _context_key(self, session_id: str) -> str:
        return f"aura:session:{session_id}:context"

    async def add_message(self, session_id: str, role: str, content: str) -> None:
        r = await self._get_redis()
        key = self._session_key(session_id)
        message = json.dumps({"role": role, "content": content})
        await r.rpush(key, message)
        await r.expire(key, 7200)  # 2h TTL

    async def get_history(self, session_id: str, max_messages: int = 20) -> List[BaseMessage]:
        r = await self._get_redis()
        key = self._session_key(session_id)
        raw_messages = await r.lrange(key, -max_messages, -1)

        messages: List[BaseMessage] = []
        for raw in raw_messages:
            msg = json.loads(raw)
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        return messages

    async def get_history_as_text(self, session_id: str, max_messages: int = 10) -> str:
        r = await self._get_redis()
        key = self._session_key(session_id)
        raw_messages = await r.lrange(key, -max_messages, -1)

        lines = []
        for raw in raw_messages:
            msg = json.loads(raw)
            prefix = "Aluno" if msg["role"] == "user" else "AURA"
            lines.append(f"{prefix}: {msg['content']}")
        return "\n".join(lines)

    async def set_context(self, session_id: str, context: dict) -> None:
        r = await self._get_redis()
        key = self._context_key(session_id)
        await r.set(key, json.dumps(context), ex=7200)

    async def get_context(self, session_id: str) -> dict:
        r = await self._get_redis()
        key = self._context_key(session_id)
        raw = await r.get(key)
        return json.loads(raw) if raw else {}

    async def update_context(self, session_id: str, updates: dict) -> dict:
        ctx = await self.get_context(session_id)
        ctx.update(updates)
        await self.set_context(session_id, ctx)
        return ctx

    async def clear_session(self, session_id: str) -> None:
        r = await self._get_redis()
        await r.delete(self._session_key(session_id), self._context_key(session_id))

    async def is_authenticated(self, session_id: str) -> bool:
        ctx = await self.get_context(session_id)
        return ctx.get("authenticated", False)

    async def get_student_ra(self, session_id: str) -> Optional[str]:
        ctx = await self.get_context(session_id)
        return ctx.get("ra")


memory = ConversationMemory()
