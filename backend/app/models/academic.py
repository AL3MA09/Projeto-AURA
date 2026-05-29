from sqlalchemy import String, Text, DateTime, Integer, Date, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base import Base


class AcademicCalendar(Base):
    __tablename__ = "academic_calendar"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    event_date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    end_date: Mapped[Date] = mapped_column(Date, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # prova | ferias | matricula | evento
    semester: Mapped[str] = mapped_column(String(10), nullable=True)   # 2026.1
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    source_url: Mapped[str] = mapped_column(String(500), nullable=True)
    scraped_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Professor(Base):
    __tablename__ = "professors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=True)
    lattes_url: Mapped[str] = mapped_column(String(500), nullable=True)
    photo_url: Mapped[str] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Discipline(Base):
    __tablename__ = "disciplines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    syllabus: Mapped[str] = mapped_column(Text, nullable=True)
    workload_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=80)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    course: Mapped[str] = mapped_column(String(100), nullable=False)
    professor_id: Mapped[int] = mapped_column(Integer, nullable=True)
    schedule: Mapped[dict] = mapped_column(JSON, nullable=True)  # {day, start, end, room}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    tags: Mapped[dict] = mapped_column(JSON, default=list)
    source_url: Mapped[str] = mapped_column(String(500), nullable=True)
    chroma_id: Mapped[str] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    scraped_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
