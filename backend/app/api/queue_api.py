from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.extra import WaitingQueueEntry
from app.models.station import Station
from app.models.other import Notification
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/queue", tags=["Waiting Queue"])

class QueueJoin(BaseModel):
    station_id: int
    vehicle_id: Optional[int] = None
    preferred_start: Optional[datetime] = None
    duration_min: int = 60

class QueueOut(BaseModel):
    id: int
    user_id: int
    station_id: int
    duration_min: int
    status: str
    created_at: Optional[datetime] = None
    station_name: Optional[str] = None
    position: Optional[int] = None

    class Config:
        from_attributes = True

@router.post("/join", response_model=QueueOut, status_code=201)
def join_queue(
    body: QueueJoin,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    st = db.query(Station).filter(Station.id == body.station_id, Station.is_active == True).first()
    if not st:
        raise HTTPException(404, "Station not found")
    existing = db.query(WaitingQueueEntry).filter(
        WaitingQueueEntry.user_id == user.id,
        WaitingQueueEntry.station_id == body.station_id,
        WaitingQueueEntry.status == "waiting",
    ).first()
    if existing:
        raise HTTPException(400, "Already in waiting queue for this station")
    entry = WaitingQueueEntry(
        user_id=user.id,
        station_id=body.station_id,
        vehicle_id=body.vehicle_id,
        preferred_start=body.preferred_start,
        duration_min=body.duration_min,
        status="waiting",
    )
    db.add(entry)
    db.add(Notification(
        user_id=user.id,
        title="Joined waiting queue",
        message=f"You joined the queue at {st.name}. We will notify you when a slot opens.",
        is_read=False,
    ))
    db.commit()
    db.refresh(entry)
    pos = db.query(WaitingQueueEntry).filter(
        WaitingQueueEntry.station_id == body.station_id,
        WaitingQueueEntry.status == "waiting",
        WaitingQueueEntry.id <= entry.id,
    ).count()
    return QueueOut(
        id=entry.id, user_id=entry.user_id, station_id=entry.station_id,
        duration_min=entry.duration_min, status=entry.status,
        created_at=entry.created_at, station_name=st.name, position=pos,
    )

@router.get("/me", response_model=List[QueueOut])
def my_queue(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(WaitingQueueEntry)
        .filter(WaitingQueueEntry.user_id == user.id)
        .order_by(WaitingQueueEntry.created_at.desc())
        .limit(20)
        .all()
    )
    result = []
    for e in rows:
        st = db.query(Station).filter(Station.id == e.station_id).first()
        result.append(QueueOut(
            id=e.id, user_id=e.user_id, station_id=e.station_id,
            duration_min=e.duration_min, status=e.status,
            created_at=e.created_at,
            station_name=st.name if st else None,
        ))
    return result

@router.post("/{entry_id}/cancel", response_model=QueueOut)
def cancel_queue(
    entry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    e = db.query(WaitingQueueEntry).filter(
        WaitingQueueEntry.id == entry_id, WaitingQueueEntry.user_id == user.id
    ).first()
    if not e:
        raise HTTPException(404, "Queue entry not found")
    e.status = "cancelled"
    db.commit()
    db.refresh(e)
    return QueueOut(
        id=e.id, user_id=e.user_id, station_id=e.station_id,
        duration_min=e.duration_min, status=e.status, created_at=e.created_at,
    )
