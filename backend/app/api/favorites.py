from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database.session import get_db
from app.models.extra import Favorite
from app.models.station import Station
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/favorites", tags=["Favorites"])

class FavOut(BaseModel):
    id: int
    station_id: int
    name: str
    address: str
    city: Optional[str] = None
    latitude: float
    longitude: float

@router.get("/me", response_model=List[FavOut])
def my_favorites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Favorite).filter(Favorite.user_id == user.id).all()
    result = []
    for f in rows:
        s = db.query(Station).filter(Station.id == f.station_id).first()
        if s:
            result.append(FavOut(
                id=f.id, station_id=s.id, name=s.name, address=s.address,
                city=s.city, latitude=s.latitude, longitude=s.longitude,
            ))
    return result

@router.post("/{station_id}", status_code=201)
def add_favorite(
    station_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not db.query(Station).filter(Station.id == station_id).first():
        raise HTTPException(404, "Station not found")
    exists = db.query(Favorite).filter(
        Favorite.user_id == user.id, Favorite.station_id == station_id
    ).first()
    if exists:
        return {"id": exists.id, "status": "already_favorited"}
    f = Favorite(user_id=user.id, station_id=station_id)
    db.add(f)
    db.commit()
    db.refresh(f)
    return {"id": f.id, "status": "added"}

@router.delete("/{station_id}", status_code=204)
def remove_favorite(
    station_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    f = db.query(Favorite).filter(
        Favorite.user_id == user.id, Favorite.station_id == station_id
    ).first()
    if f:
        db.delete(f)
        db.commit()
