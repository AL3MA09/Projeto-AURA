from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.v1.router import api_router
from app.ai.rag import rag
from app.db.base import engine, Base

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AURA starting up...")

    # Criar tabelas do banco
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ready")

    # Inicializar RAG / ChromaDB
    await rag.initialize()
    logger.info("RAG engine ready")

    # Agendar scraping periódico
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.scraper.fatec_scraper import run_scraper_job

    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        run_scraper_job,
        "interval",
        hours=settings.SCRAPER_INTERVAL_HOURS,
        id="fatec_scraper",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(f"Scraper scheduled every {settings.SCRAPER_INTERVAL_HOURS}h")

    logger.info("✅ AURA is ready to assist!")
    yield

    scheduler.shutdown()
    await engine.dispose()
    logger.info("AURA shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API da AURA — Assistente Universitária de Respostas Acadêmicas — FATEC Zona Sul",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    elapsed = int((time.monotonic() - start) * 1000)
    response.headers["X-Process-Time-Ms"] = str(elapsed)
    return response


# ── Exception Handlers ─────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno. Nossa equipe foi notificada."},
    )


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "message": "Olá! Sou a AURA, assistente da FATEC Zona Sul. Como posso ajudar?",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "aura-backend"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
