from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.support import SupportTicket
from app.api.deps import get_current_user, require_role
from app.models.user import User

router = APIRouter(prefix="/support", tags=["Support & Queries"])

class TicketCreate(BaseModel):
    subject: str
    description: str
    category: str = "general"
    station_id: Optional[int] = None
    booking_id: Optional[int] = None
    priority: str = "medium"

class TicketReply(BaseModel):
    response: str
    status: str = "resolved"

class TicketOut(BaseModel):
    id: int
    user_id: int
    subject: str
    category: str
    description: str
    status: str
    priority: str
    station_id: Optional[int] = None
    booking_id: Optional[int] = None
    response: Optional[str] = None
    created_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.post("/tickets", response_model=TicketOut, status_code=201)
def create_ticket(body: TicketCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = SupportTicket(
        user_id=user.id, subject=body.subject, description=body.description,
        category=body.category, station_id=body.station_id, booking_id=body.booking_id,
        priority=body.priority, status="open",
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return TicketOut(
        id=t.id, user_id=t.user_id, subject=t.subject, category=t.category,
        description=t.description, status=t.status, priority=t.priority,
        station_id=t.station_id, booking_id=t.booking_id, response=t.response,
        created_at=t.created_at, user_name=user.full_name,
    )

@router.get("/tickets/me", response_model=List[TicketOut])
def my_tickets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(SupportTicket).filter(SupportTicket.user_id == user.id).order_by(SupportTicket.created_at.desc()).all()
    return [
        TicketOut(
            id=t.id, user_id=t.user_id, subject=t.subject, category=t.category,
            description=t.description, status=t.status, priority=t.priority,
            station_id=t.station_id, booking_id=t.booking_id, response=t.response,
            created_at=t.created_at, user_name=user.full_name,
        ) for t in rows
    ]

@router.get("/tickets", response_model=List[TicketOut])
def all_tickets(db: Session = Depends(get_db), admin: User = Depends(require_role("admin", "operator"))):
    rows = db.query(SupportTicket).order_by(SupportTicket.created_at.desc()).limit(100).all()
    result = []
    for t in rows:
        u = db.query(User).filter(User.id == t.user_id).first()
        result.append(TicketOut(
            id=t.id, user_id=t.user_id, subject=t.subject, category=t.category,
            description=t.description, status=t.status, priority=t.priority,
            station_id=t.station_id, booking_id=t.booking_id, response=t.response,
            created_at=t.created_at, user_name=u.full_name if u else None,
        ))
    return result

@router.post("/tickets/{ticket_id}/reply", response_model=TicketOut)
def reply_ticket(ticket_id: int, body: TicketReply, db: Session = Depends(get_db), admin: User = Depends(require_role("admin", "operator"))):
    t = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not t:
        raise HTTPException(404, "Ticket not found")
    t.response = body.response
    t.status = body.status
    t.assigned_to = admin.id
    db.commit()
    db.refresh(t)
    u = db.query(User).filter(User.id == t.user_id).first()
    return TicketOut(
        id=t.id, user_id=t.user_id, subject=t.subject, category=t.category,
        description=t.description, status=t.status, priority=t.priority,
        station_id=t.station_id, booking_id=t.booking_id, response=t.response,
        created_at=t.created_at, user_name=u.full_name if u else None,
    )
