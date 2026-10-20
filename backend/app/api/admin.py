from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.database.session import get_db
from app.models.user import User
from app.models.station import Station, Charger
from app.models.booking import Booking
from app.models.other import FaultReport, Notification
from app.schemas.admin import PlatformStats, UserAdminOut
from app.schemas.station import StationOut, ChargerOut
from app.api.deps import require_role
from app.services.auth_service import hash_password, get_user_by_email

router = APIRouter(prefix="/admin", tags=["Admin"])


class OperatorCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    gstin: Optional[str] = None
    city: Optional[str] = "Pune"
    address: Optional[str] = None


class StationAssign(BaseModel):
    operator_id: int


class StationAdminCreate(BaseModel):
    name: str
    address: str
    city: str = "Pune"
    latitude: float
    longitude: float
    operating_hours: str = "06:00-23:00"
    description: Optional[str] = None
    operator_id: Optional[int] = None


class ChargerAdminCreate(BaseModel):
    station_id: int
    label: str
    connector_type: str
    power_kw: float
    price_per_kwh: float = 12.0


@router.get("/stats", response_model=PlatformStats)
def platform_stats(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    return PlatformStats(
        total_users=db.query(User).filter(User.role == "ev_owner").count(),
        total_operators=db.query(User).filter(User.role == "operator").count(),
        total_stations=db.query(Station).count(),
        total_chargers=db.query(Charger).count(),
        total_bookings=db.query(Booking).count(),
        active_bookings=db.query(Booking).filter(Booking.status.in_(["confirmed", "pending"])).count(),
        open_faults=db.query(FaultReport).filter(FaultReport.status == "open").count(),
    )


@router.get("/users", response_model=List[UserAdminOut])
def list_users(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    users = db.query(User).order_by(User.created_at.desc()).limit(200).all()
    return [UserAdminOut.model_validate(u) for u in users]


@router.post("/operators", response_model=UserAdminOut, status_code=201)
def create_operator(
    body: OperatorCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """Only admin can register station operators."""
    if get_user_by_email(db, body.email):
        raise HTTPException(400, "Email already registered")
    op = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role="operator",
        is_active=True,
        is_verified=True,
        company_name=body.company_name,
        gstin=body.gstin,
        city=body.city or "Pune",
        address=body.address,
        state="Maharashtra",
    )
    db.add(op)
    db.flush()
    db.add(Notification(
        user_id=op.id,
        title="Operator account created",
        message="An admin created your operator account. Log in to manage your assigned stations.",
        is_read=False,
    ))
    db.commit()
    db.refresh(op)
    return UserAdminOut.model_validate(op)


@router.get("/stations", response_model=List[StationOut])
def list_all_stations(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    from sqlalchemy.orm import joinedload
    stations = db.query(Station).options(joinedload(Station.chargers)).all()
    result = []
    for s in stations:
        avail = sum(1 for c in s.chargers if c.is_available and not c.is_faulty)
        result.append(StationOut(
            id=s.id, name=s.name, address=s.address, city=s.city,
            latitude=s.latitude, longitude=s.longitude, is_active=s.is_active,
            operating_hours=s.operating_hours, description=s.description,
            chargers=[ChargerOut.model_validate(c) for c in s.chargers],
            available_chargers=avail,
        ))
    return result


@router.post("/stations", status_code=201)
def create_station(
    body: StationAdminCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    if body.operator_id:
        op = db.query(User).filter(User.id == body.operator_id, User.role == "operator").first()
        if not op:
            raise HTTPException(400, "operator_id must be a valid operator")
    st = Station(
        name=body.name, address=body.address, city=body.city,
        latitude=body.latitude, longitude=body.longitude,
        operating_hours=body.operating_hours, description=body.description,
        operator_id=body.operator_id, is_active=True,
    )
    db.add(st)
    db.commit()
    db.refresh(st)
    return {"id": st.id, "name": st.name, "operator_id": st.operator_id}


@router.post("/chargers", status_code=201)
def create_charger(
    body: ChargerAdminCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    st = db.query(Station).filter(Station.id == body.station_id).first()
    if not st:
        raise HTTPException(404, "Station not found")
    ch = Charger(
        station_id=body.station_id, label=body.label,
        connector_type=body.connector_type, power_kw=body.power_kw,
        price_per_kwh=body.price_per_kwh, is_available=True,
        is_faulty=False, status="available",
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ChargerOut.model_validate(ch)


@router.patch("/stations/{station_id}/assign")
def assign_operator(
    station_id: int,
    body: StationAssign,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    s = db.query(Station).filter(Station.id == station_id).first()
    if not s:
        raise HTTPException(404, "Station not found")
    op = db.query(User).filter(User.id == body.operator_id, User.role == "operator").first()
    if not op:
        raise HTTPException(400, "Invalid operator")
    s.operator_id = body.operator_id
    db.commit()
    return {"id": s.id, "name": s.name, "operator_id": s.operator_id, "operator_name": op.full_name}


@router.patch("/users/{user_id}/toggle-active", response_model=UserAdminOut)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    if u.id == admin.id:
        raise HTTPException(400, "Cannot deactivate yourself")
    u.is_active = not u.is_active
    db.commit()
    db.refresh(u)
    return UserAdminOut.model_validate(u)


@router.patch("/users/{user_id}/verify", response_model=UserAdminOut)
def verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    u.is_verified = True
    db.commit()
    db.refresh(u)
    return UserAdminOut.model_validate(u)


@router.patch("/stations/{station_id}/toggle-active")
def toggle_station(
    station_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    s = db.query(Station).filter(Station.id == station_id).first()
    if not s:
        raise HTTPException(404, "Station not found")
    s.is_active = not s.is_active
    db.commit()
    return {"id": s.id, "is_active": s.is_active, "name": s.name}


@router.get("/bookings")
def admin_bookings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    from sqlalchemy.orm import joinedload
    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.charger).joinedload(Charger.station))
        .order_by(Booking.start_time.desc())
        .limit(100)
        .all()
    )
    result = []
    for b in bookings:
        result.append({
            "id": b.id,
            "user_id": b.user_id,
            "status": b.status,
            "start_time": b.start_time.isoformat() if b.start_time else None,
            "end_time": b.end_time.isoformat() if b.end_time else None,
            "estimated_cost": b.estimated_cost,
            "station_name": b.charger.station.name if b.charger and b.charger.station else None,
            "charger_label": b.charger.label if b.charger else None,
        })
    return result


@router.get("/audit")
def list_audit(
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    from app.models.extra import AuditLog
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "action": l.action,
            "detail": l.detail,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


def _audit(db, actor_id, action, detail):
    from app.models.extra import AuditLog
    db.add(AuditLog(actor_id=actor_id, action=action, detail=detail))
