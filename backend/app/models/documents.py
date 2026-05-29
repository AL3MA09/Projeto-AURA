from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class DocumentTypeEnum(str, enum.Enum):
    ENROLLMENT_DECLARATION = "declaracao_matricula"
    TRANSCRIPT = "historico_escolar"
    ATTENDANCE_CERTIFICATE = "atestado_frequencia"
    ENROLLMENT_PROOF = "comprovante_matricula"
    INTERNSHIP_APPROVAL = "aprovacao_estagio"
    SCHEDULE_CONFIRMATION = "confirmacao_horario"


class DocumentStatusEnum(str, enum.Enum):
    PENDING = "pendente"
    PROCESSING = "processando"
    COMPLETED = "concluido"
    FAILED = "falhou"
    DELIVERED = "entregue"


class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    doc_type: Mapped[DocumentTypeEnum] = mapped_column(Enum(DocumentTypeEnum), nullable=False)
    status: Mapped[DocumentStatusEnum] = mapped_column(
        Enum(DocumentStatusEnum), default=DocumentStatusEnum.PENDING, nullable=False
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=True)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    requested_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)

    student = relationship("Student", back_populates="documents")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    session_id: Mapped[str] = mapped_column(String(64), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="audit_logs")
