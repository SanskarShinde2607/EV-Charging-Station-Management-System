from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database.session import get_db
from app.models.station import Station, Charger
from app.schemas.station import StationOut, ChargerOut
from app.dsa_bridge import get_dsa_bridge
from app.api.deps import get_current_user, require_role
from app.models.user import User

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("/", response_model=List[StationOut])
def list_stations(
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    connector: Optional[str] = Query(None),
    max_distance: float = Query(50.0),
    available_only: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Station).options(joinedload(Station.chargers)).filter(Station.is_active == True)
    stations = q.all()
    bridge = get_dsa_bridge()
    result = []
    for s in stations:
        chargers = s.chargers
        if connector:
            chargers = [c for c in chargers if c.connector_type.lower() == connector.lower()]
        if available_only:
            chargers = [c for c in chargers if c.is_available and not c.is_faulty]
        avail = sum(1 for c in s.chargers if c.is_available and not c.is_faulty)
        dist = None
        if lat is not None and lon is not None:
            dist = bridge.haversine_km(lat, lon, s.latitude, s.longitude)
            if dist > max_distance:
                continue
        out = StationOut(
            id=s.id,
            name=s.name,
            address=s.address,
            city=s.city,
            latitude=s.latitude,
            longitude=s.longitude,
            is_active=s.is_active,
            operating_hours=s.operating_hours,
            description=s.description,
            phone=getattr(s, 'phone', None),
            support_email=getattr(s, 'support_email', None),
            support_phone=getattr(s, 'support_phone', None),
            facilities=getattr(s, 'facilities', None),
            status=getattr(s, 'status', 'open'),
            chargers=[ChargerOut.model_validate(c) for c in s.chargers],
            available_chargers=avail,
            distance_km=round(dist, 2) if dist is not None else None,
        )
        result.append(out)
    if lat is not None:
        result.sort(key=lambda x: x.distance_km or 999)
    return result

@router.get("/{station_id}", response_model=StationOut)
def get_station(station_id: int, db: Session = Depends(get_db)):
    s = db.query(Station).options(joinedload(Station.chargers)).filter(Station.id == station_id).first()
    if not s:
        raise HTTPException(404, "Station not found")
    avail = sum(1 for c in s.chargers if c.is_available and not c.is_faulty)
    return StationOut(
        id=s.id,
        name=s.name,
        address=s.address,
        city=s.city,
        latitude=s.latitude,
        longitude=s.longitude,
        is_active=s.is_active,
        operating_hours=s.operating_hours,
        description=s.description,
        phone=getattr(s, 'phone', None),
        support_email=getattr(s, 'support_email', None),
        support_phone=getattr(s, 'support_phone', None),
        facilities=getattr(s, 'facilities', None),
        status=getattr(s, 'status', 'open'),
        chargers=[ChargerOut.model_validate(c) for c in s.chargers],
        available_chargers=avail,
    )
