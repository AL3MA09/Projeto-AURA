from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import hashlib

from app.db.base import get_db
from app.models.student import Student
from app.core.security import verify_password, create_access_token, decode_token, mask_ra
from loguru import logger

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student_name: str
    ra: str
    course: str


class ValidateIdentityRequest(BaseModel):
    ra: str
    cpf_partial: str  # Apenas 3 primeiros dígitos


@router.post("/login", response_model=TokenResponse)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Login via portal do aluno (RA + senha do portal FATEC)."""
    stmt = select(Student).where(Student.ra == form.username)
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()

    if not student or not verify_password(form.password, student.hashed_password):
        logger.warning(f"Failed login attempt for RA: {mask_ra(form.username)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="RA ou senha incorretos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not student.is_active:
        raise HTTPException(status_code=403, detail="Conta inativa. Contate a secretaria.")

    token = create_access_token(subject=student.id)
    logger.info(f"AUDIT: Login bem-sucedido para RA {mask_ra(student.ra)}")

    return TokenResponse(
        access_token=token,
        student_name=student.name,
        ra=student.ra,
        course=student.course.value,
    )


@router.post("/validate-identity")
async def validate_identity(
    req: ValidateIdentityRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Validação leve de identidade no chat — apenas RA + 3 dígitos do CPF.
    Não gera JWT, apenas confirma identidade para o fluxo conversacional.
    """
    if len(req.cpf_partial) != 3 or not req.cpf_partial.isdigit():
        raise HTTPException(status_code=422, detail="CPF parcial deve ter exatamente 3 dígitos.")

    stmt = select(Student).where(Student.ra == req.ra.strip())
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()

    if not student:
        logger.warning(f"Identity validation: RA not found {mask_ra(req.ra)}")
        raise HTTPException(status_code=404, detail="RA não encontrado.")

    # Verifica os 3 primeiros dígitos do CPF (hash SHA-256 parcial)
    from app.core.security import decrypt_sensitive
    cpf_full = decrypt_sensitive(student.cpf_encrypted)
    cpf_digits_only = cpf_full.replace(".", "").replace("-", "").replace(" ", "")

    if not cpf_digits_only.startswith(req.cpf_partial):
        logger.warning(f"AUDIT: Identity validation failed for RA {mask_ra(req.ra)}")
        raise HTTPException(status_code=401, detail="Dados de validação incorretos.")

    logger.info(f"AUDIT: Identity validated for RA {mask_ra(req.ra)}")
    return {
        "validated": True,
        "student_name": student.name.split()[0],  # Apenas primeiro nome
        "course": student.course.value,
        "semester": student.semester,
        "email": student.email,
        "ra": student.ra,
        "is_enrolled": student.is_enrolled,
    }


async def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Student:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

    stmt = select(Student).where(Student.id == int(payload["sub"]))
    result = await db.execute(stmt)
    student = result.scalar_one_or_none()

    if not student or not student.is_active:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")
    return student
