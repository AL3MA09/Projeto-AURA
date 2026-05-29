from sqlalchemy import String, Boolean, DateTime, Text, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class CourseEnum(str, enum.Enum):
    ADS = "Análise e Desenvolvimento de Sistemas"
    GESTAO_TI = "Gestão de Tecnologia da Informação"
    LOGISTICA = "Logística"
    MARKETING = "Marketing"
    MANUTENCAO = "Manutenção de Aeronaves"


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ra: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    cpf_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # SHA-256 do CPF
    cpf_encrypted: Mapped[str] = mapped_column(Text, nullable=False)   # Fernet-encrypted
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    course: Mapped[CourseEnum] = mapped_column(Enum(CourseEnum), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_enrolled: Mapped[bool] = mapped_column(Boolean, default=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    conversations = relationship("Conversation", back_populates="student", cascade="all, delete-orphan")
    documents = relationship("DocumentRequest", back_populates="student", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="student")
