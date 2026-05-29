import sys
from loguru import logger
from app.core.config import settings


def setup_logging():
    logger.remove()

    fmt = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )

    logger.add(sys.stdout, format=fmt, level="DEBUG" if settings.DEBUG else "INFO", colorize=True)

    logger.add(
        "logs/aura_{time:YYYY-MM-DD}.log",
        rotation="00:00",
        retention="30 days",
        compression="zip",
        level="INFO",
        format=fmt,
        enqueue=True,
    )

    if settings.AUDIT_LOG_ENABLED:
        logger.add(
            "logs/audit_{time:YYYY-MM-DD}.log",
            rotation="00:00",
            retention="90 days",
            compression="zip",
            level="INFO",
            filter=lambda r: "AUDIT" in r["message"],
            enqueue=True,
        )

    return logger
