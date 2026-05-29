from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from cryptography.fernet import Fernet
import base64
import hashlib
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Fernet key derivado do DATA_ENCRYPTION_KEY
_fernet_key = base64.urlsafe_b64encode(
    hashlib.sha256(settings.DATA_ENCRYPTION_KEY.encode()).digest()
)
_fernet = Fernet(_fernet_key)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: Any, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return jwt.encode(
        {"sub": str(subject), "exp": expire, "type": "access"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_refresh_token(subject: Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": str(subject), "exp": expire, "type": "refresh"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


# ── LGPD: criptografia de dados sensíveis ────────────────────────────────────
def encrypt_sensitive(data: str) -> str:
    return _fernet.encrypt(data.encode()).decode()


def decrypt_sensitive(data: str) -> str:
    return _fernet.decrypt(data.encode()).decode()


def mask_ra(ra: str) -> str:
    """Exibe apenas primeiros 3 dígitos — logs seguros."""
    return ra[:3] + "*" * max(0, len(ra) - 3)


def mask_cpf(cpf: str) -> str:
    """Mascara CPF para logs: ***.***.XXX-**"""
    clean = cpf.replace(".", "").replace("-", "")
    return f"***.***.*{clean[6:9]}-**" if len(clean) >= 9 else "***"
