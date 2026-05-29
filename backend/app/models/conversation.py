from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, Boolean, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class IntentEnum(str, enum.Enum):
    GENERAL_QUERY = "general_query"
    CALENDAR = "calendar"
    DOCUMENT_REQUEST = "document_request"
    ENROLLMENT_LOCK = "enrollment_lock"
    ENROLLMENT_TRANSFER = "enrollment_transfer"
    INTERNSHIP = "internship"
    DISCIPLINE_INFO = "discipline_info"
    PROFESSOR_INFO = "professor_info"
    GRADE_INFO = "grade_info"
    AUTHENTICATION = "authentication"
    GREETING = "greeting"
    FAREWELL = "farewell"
    UNKNOWN = "unknown"


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("students.id"), nullable=True)
    is_authenticated: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ended_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    channel: Mapped[str] = mapped_column(String(20), default="web")  # web | voice | kiosk

    student = relationship("Student", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user | assistant | system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    intent: Mapped[IntentEnum] = mapped_column(Enum(IntentEnum), default=IntentEnum.UNKNOWN, nullable=True)
    confidence: Mapped[float] = mapped_column(default=0.0, nullable=True)
    sources: Mapped[dict] = mapped_column(JSON, default=list, nullable=True)  # RAG sources
    audio_url: Mapped[str] = mapped_column(String(500), nullable=True)  # TTS audio cache URL
    processing_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
