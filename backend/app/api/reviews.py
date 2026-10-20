from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.database.session import get_db
from app.models.other import Review
from app.models.station import Station
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/reviews", tags=["Reviews"])

class ReviewCreate(BaseModel):
    station_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    user_id: int
    station_id: int
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/station/{station_id}", response_model=List[ReviewOut])
def station_reviews(station_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Review)
        .options(joinedload(Review.user))
        .filter(Review.station_id == station_id)
        .order_by(Review.created_at.desc())
        .limit(50)
        .all()
    )
    result = []
    for r in rows:
        result.append(ReviewOut(
            id=r.id, user_id=r.user_id, station_id=r.station_id,
            rating=r.rating, comment=r.comment, created_at=r.created_at,
            user_name=r.user.full_name if r.user else None,
        ))
    return result

@router.post("/", response_model=ReviewOut, status_code=201)
def create_review(
    body: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.query(Station).filter(Station.id == body.station_id).first():
        raise HTTPException(404, "Station not found")
    rev = Review(
        user_id=user.id,
        station_id=body.station_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(rev)
    db.commit()
    db.refresh(rev)
    return ReviewOut(
        id=rev.id, user_id=rev.user_id, station_id=rev.station_id,
        rating=rev.rating, comment=rev.comment, created_at=rev.created_at,
        user_name=user.full_name,
    )
