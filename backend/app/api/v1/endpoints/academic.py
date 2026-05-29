from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel

from app.db.base import get_db
from app.models.academic import AcademicCalendar, Professor, Discipline
from loguru import logger

router = APIRouter(prefix="/academic", tags=["Academic"])


class CalendarEventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_date: date
    end_date: Optional[date]
    category: str
    semester: Optional[str]

    class Config:
        from_attributes = True


class ProfessorOut(BaseModel):
    id: int
    name: str
    email: Optional[str]
    photo_url: Optional[str]

    class Config:
        from_attributes = True


class DisciplineOut(BaseModel):
    id: int
    code: str
    name: str
    workload_hours: int
    semester: int
    course: str
    schedule: Optional[dict]

    class Config:
        from_attributes = True


@router.get("/calendar", response_model=List[CalendarEventOut])
async def get_calendar(
    semester: Optional[str] = Query(None, description="Ex: 2026.1"),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AcademicCalendar).where(AcademicCalendar.is_active == True)
    if semester:
        stmt = stmt.where(AcademicCalendar.semester == semester)
    if category:
        stmt = stmt.where(AcademicCalendar.category == category)
    stmt = stmt.order_by(AcademicCalendar.event_date)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/calendar/next-exam")
async def get_next_exam(db: AsyncSession = Depends(get_db)):
    today = date.today()
    stmt = (
        select(AcademicCalendar)
        .where(
            and_(
                AcademicCalendar.category == "prova",
                AcademicCalendar.event_date >= today,
                AcademicCalendar.is_active == True,
            )
        )
        .order_by(AcademicCalendar.event_date)
        .limit(1)
    )
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()

    if not event:
        return {"message": "Nenhuma prova agendada encontrada no calendário."}

    days_until = (event.event_date - today).days
    return {
        "title": event.title,
        "date": event.event_date.strftime("%d/%m/%Y"),
        "days_until": days_until,
        "message": (
            f"A próxima prova é '{event.title}', em {event.event_date.strftime('%d/%m/%Y')} "
            f"({'amanhã' if days_until == 1 else f'em {days_until} dias'})."
        ),
    }


@router.get("/professors", response_model=List[ProfessorOut])
async def get_professors(
    name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Professor).where(Professor.is_active == True)
    if name:
        stmt = stmt.where(Professor.name.ilike(f"%{name}%"))
    stmt = stmt.order_by(Professor.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/disciplines", response_model=List[DisciplineOut])
async def get_disciplines(
    course: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Discipline).where(Discipline.is_active == True)
    if course:
        stmt = stmt.where(Discipline.course.ilike(f"%{course}%"))
    if semester:
        stmt = stmt.where(Discipline.semester == semester)
    if name:
        stmt = stmt.where(Discipline.name.ilike(f"%{name}%"))
    stmt = stmt.order_by(Discipline.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/disciplines/{code}")
async def get_discipline_by_code(code: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Discipline).where(Discipline.code == code.upper())
    result = await db.execute(stmt)
    discipline = result.scalar_one_or_none()
    if not discipline:
        raise HTTPException(status_code=404, detail=f"Disciplina '{code}' não encontrada.")
    return discipline
