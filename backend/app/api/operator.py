from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.station import Station, Charger
from app.models.booking import Booking
from app.models.other import FaultReport
from app.schemas.admin import OperatorStationOut, ChargerUpdate, FaultReportOut, FaultReportCreate
from app.schemas.station import ChargerOut
from app.schemas.booking import BookingOut
from app.api.deps import get_current_user, require_role
from app.models.user import User

router = APIRouter(prefix="/operator", tags=["Operator"])

@router.get("/stations", response_model=List[OperatorStationOut])
def my_stations(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    q = db.query(Station).options(joinedload(Station.chargers))
    if user.role == "operator":
        q = q.filter(Station.operator_id == user.id)
    stations = q.all()
    result = []
    for s in stations:
        avail = sum(1 for c in s.chargers if c.is_available and not c.is_faulty)
        result.append(OperatorStationOut(
            id=s.id, name=s.name, address=s.address, city=s.city,
            latitude=s.latitude, longitude=s.longitude, is_active=s.is_active,
            operating_hours=s.operating_hours,
            charger_count=len(s.chargers), available_count=avail,
        ))
    return result

@router.get("/stations/{station_id}/chargers", response_model=List[ChargerOut])
def station_chargers(
    station_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    s = db.query(Station).options(joinedload(Station.chargers)).filter(Station.id == station_id).first()
    if not s:
        raise HTTPException(404, "Station not found")
    if user.role == "operator" and s.operator_id != user.id:
        raise HTTPException(403, "Not your station")
    return [ChargerOut.model_validate(c) for c in s.chargers]

@router.patch("/chargers/{charger_id}", response_model=ChargerOut)
def update_charger(
    charger_id: int,
    body: ChargerUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    c = db.query(Charger).options(joinedload(Charger.station)).filter(Charger.id == charger_id).first()
    if not c:
        raise HTTPException(404, "Charger not found")
    if user.role == "operator" and (not c.station or c.station.operator_id != user.id):
        raise HTTPException(403, "Not your charger")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return ChargerOut.model_validate(c)

@router.get("/bookings", response_model=List[BookingOut])
def operator_bookings(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    """Bookings for chargers at stations assigned to this operator (all stations if admin)."""
    from app.models.vehicle import Vehicle

    # Resolve station IDs this operator may see
    sq = db.query(Station.id)
    if user.role == "operator":
        sq = sq.filter(Station.operator_id == user.id)
    station_ids = [row[0] for row in sq.all()]

    if not station_ids and user.role == "operator":
        return []

    cq = db.query(Charger.id)
    if station_ids:
        cq = cq.filter(Charger.station_id.in_(station_ids))
    charger_ids = [row[0] for row in cq.all()]

    if not charger_ids:
        return []

    bookings = (
        db.query(Booking)
        .options(joinedload(Booking.charger).joinedload(Charger.station))
        .filter(Booking.charger_id.in_(charger_ids))
        .order_by(Booking.start_time.desc())
        .limit(150)
        .all()
    )

    result = []
    for b in bookings:
        reg = None
        vlabel = None
        if b.vehicle_id:
            v = db.query(Vehicle).filter(Vehicle.id == b.vehicle_id).first()
            if v:
                reg = v.license_plate
                vlabel = f"{v.make} {v.model}"
        ch = b.charger
        st = ch.station if ch else None
        result.append(BookingOut(
            id=b.id,
            user_id=b.user_id,
            charger_id=b.charger_id,
            vehicle_id=b.vehicle_id,
            start_time=b.start_time,
            end_time=b.end_time,
            status=b.status,
            estimated_cost=b.estimated_cost,
            notes=b.notes,
            created_at=b.created_at,
            station_name=st.name if st else None,
            charger_label=ch.label if ch else None,
            vehicle_reg=reg,
            vehicle_label=vlabel,
            connector_type=ch.connector_type if ch else None,
            booking_code=f"EVC-{b.id:06d}",
        ))
    return result

@router.get("/faults", response_model=List[FaultReportOut])
def list_faults(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    faults = db.query(FaultReport).order_by(FaultReport.created_at.desc()).limit(50).all()
    result = []
    for f in faults:
        charger = db.query(Charger).options(joinedload(Charger.station)).filter(Charger.id == f.charger_id).first()
        if user.role == "operator" and charger and charger.station and charger.station.operator_id != user.id:
            continue
        result.append(FaultReportOut(
            id=f.id, charger_id=f.charger_id, reported_by=f.reported_by,
            description=f.description, severity=f.severity, status=f.status,
            created_at=f.created_at, resolved_at=f.resolved_at,
            charger_label=charger.label if charger else None,
            station_name=charger.station.name if charger and charger.station else None,
        ))
    return result

@router.post("/faults", response_model=FaultReportOut, status_code=201)
def report_fault(
    body: FaultReportCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    charger = db.query(Charger).filter(Charger.id == body.charger_id).first()
    if not charger:
        raise HTTPException(404, "Charger not found")
    f = FaultReport(
        charger_id=body.charger_id,
        reported_by=user.id,
        description=body.description,
        severity=body.severity,
        status="open",
    )
    charger.is_faulty = True
    charger.status = "maintenance"
    db.add(f)
    db.commit()
    db.refresh(f)
    return FaultReportOut(
        id=f.id, charger_id=f.charger_id, reported_by=f.reported_by,
        description=f.description, severity=f.severity, status=f.status,
        created_at=f.created_at,
    )

@router.post("/faults/{fault_id}/resolve", response_model=FaultReportOut)
def resolve_fault(
    fault_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    f = db.query(FaultReport).filter(FaultReport.id == fault_id).first()
    if not f:
        raise HTTPException(404, "Fault not found")
    f.status = "resolved"
    f.resolved_at = datetime.now(timezone.utc)
    charger = db.query(Charger).filter(Charger.id == f.charger_id).first()
    if charger:
        charger.is_faulty = False
        charger.status = "available"
        charger.is_available = True
    db.commit()
    db.refresh(f)
    return FaultReportOut(
        id=f.id, charger_id=f.charger_id, reported_by=f.reported_by,
        description=f.description, severity=f.severity, status=f.status,
        created_at=f.created_at, resolved_at=f.resolved_at,
    )


@router.get("/analytics")
def operator_analytics(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    """Utilization and revenue summary for operator stations."""
    q = db.query(Station)
    if user.role == "operator":
        q = q.filter(Station.operator_id == user.id)
    stations = q.all()
    station_ids = [s.id for s in stations]
    if not station_ids:
        return {
            "station_count": 0,
            "charger_count": 0,
            "total_bookings": 0,
            "confirmed_bookings": 0,
            "estimated_revenue": 0.0,
            "by_station": [],
        }

    chargers = db.query(Charger).filter(Charger.station_id.in_(station_ids)).all()
    charger_ids = [c.id for c in chargers]
    bookings = db.query(Booking).filter(Booking.charger_id.in_(charger_ids)).all() if charger_ids else []

    by_station = []
    for s in stations:
        s_chargers = [c for c in chargers if c.station_id == s.id]
        s_cids = [c.id for c in s_chargers]
        s_books = [b for b in bookings if b.charger_id in s_cids]
        rev = sum(b.estimated_cost or 0 for b in s_books if b.status in ("confirmed", "completed"))
        by_station.append({
            "station_id": s.id,
            "name": s.name,
            "bookings": len(s_books),
            "revenue": round(rev, 2),
            "chargers": len(s_chargers),
            "available": sum(1 for c in s_chargers if c.is_available and not c.is_faulty),
        })

    total_rev = sum(x["revenue"] for x in by_station)
    return {
        "station_count": len(stations),
        "charger_count": len(chargers),
        "total_bookings": len(bookings),
        "confirmed_bookings": sum(1 for b in bookings if b.status == "confirmed"),
        "estimated_revenue": round(total_rev, 2),
        "by_station": by_station,
    }


# ---- Arrival verification & charging session lifecycle ----

@router.post("/check-in")
def check_in_vehicle(
    registration: str = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    """Operator verifies vehicle by registration number against today's bookings."""
    from app.models.vehicle import Vehicle
    from datetime import timedelta

    plate = registration.strip().upper().replace(" ", "")
    vehicles = db.query(Vehicle).all()
    match_ids = [v.id for v in vehicles if (v.license_plate or "").upper().replace(" ", "") == plate]
    if not match_ids:
        raise HTTPException(404, f"No vehicle registered with plate {registration}")

    now = datetime.now(timezone.utc)
    window_start = now - timedelta(hours=2)
    window_end = now + timedelta(hours=6)

    q = (
        db.query(Booking)
        .options(joinedload(Booking.charger).joinedload(Charger.station))
        .filter(
            Booking.vehicle_id.in_(match_ids),
            Booking.status.in_(["confirmed", "arrived", "charging"]),
            Booking.start_time >= window_start,
            Booking.start_time <= window_end,
        )
    )
    if user.role == "operator":
        q = q.join(Charger).join(Station).filter(Station.operator_id == user.id)
    booking = q.order_by(Booking.start_time).first()
    if not booking:
        raise HTTPException(404, "No active booking found for this registration at your stations")

    booking.status = "arrived"
    db.commit()
    db.refresh(booking)
    v = db.query(Vehicle).filter(Vehicle.id == booking.vehicle_id).first()
    return {
        "ok": True,
        "booking_id": booking.id,
        "booking_code": f"EVC-{booking.id:06d}",
        "vehicle_reg": v.license_plate if v else registration,
        "vehicle": f"{v.make} {v.model}" if v else None,
        "station": booking.charger.station.name if booking.charger and booking.charger.station else None,
        "charger": booking.charger.label if booking.charger else None,
        "start_time": booking.start_time.isoformat(),
        "end_time": booking.end_time.isoformat(),
        "status": booking.status,
        "message": "Vehicle verified. You can start the charging session.",
    }


@router.post("/sessions/{booking_id}/start")
def start_session(
    booking_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    from app.models.booking import ChargingSession
    from app.models.other import Notification

    booking = (
        db.query(Booking)
        .options(joinedload(Booking.charger).joinedload(Charger.station))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if user.role == "operator":
        if not booking.charger or not booking.charger.station or booking.charger.station.operator_id != user.id:
            raise HTTPException(403, "Not your station")
    if booking.status not in ("confirmed", "arrived"):
        raise HTTPException(400, f"Cannot start session from status {booking.status}")

    booking.status = "charging"
    if booking.charger:
        booking.charger.status = "charging"
        booking.charger.is_available = False

    session = db.query(ChargingSession).filter(ChargingSession.booking_id == booking.id).first()
    if not session:
        session = ChargingSession(
            booking_id=booking.id,
            user_id=booking.user_id,
            charger_id=booking.charger_id,
            start_time=datetime.now(timezone.utc),
            is_simulated=True,
            status="active",
        )
        db.add(session)
    else:
        session.start_time = datetime.now(timezone.utc)
        session.status = "active"

    db.add(Notification(
        user_id=booking.user_id,
        title=f"Charging started — EVC-{booking.id:06d}",
        message="Your charging session has started at the station.",
        is_read=False,
    ))
    db.commit()
    return {"ok": True, "booking_id": booking.id, "status": "charging", "session_status": "active"}


@router.post("/sessions/{booking_id}/complete")
def complete_session(
    booking_id: int,
    energy_kwh: float = Query(0.0),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    from app.models.booking import ChargingSession
    from app.models.other import Notification

    booking = (
        db.query(Booking)
        .options(joinedload(Booking.charger).joinedload(Charger.station))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if user.role == "operator":
        if not booking.charger or not booking.charger.station or booking.charger.station.operator_id != user.id:
            raise HTTPException(403, "Not your station")
    if booking.status not in ("charging", "arrived"):
        raise HTTPException(400, f"Cannot complete from status {booking.status}")

    now = datetime.now(timezone.utc)
    booking.status = "completed"
    if booking.charger:
        booking.charger.status = "available"
        booking.charger.is_available = True

    session = db.query(ChargingSession).filter(ChargingSession.booking_id == booking.id).first()
    if session:
        session.end_time = now
        session.status = "completed"
        session.energy_kwh = energy_kwh or session.energy_kwh
        if booking.charger and energy_kwh:
            session.cost = round(energy_kwh * booking.charger.price_per_kwh, 2)
    else:
        cost = round(energy_kwh * (booking.charger.price_per_kwh if booking.charger else 12), 2)
        db.add(ChargingSession(
            booking_id=booking.id, user_id=booking.user_id, charger_id=booking.charger_id,
            start_time=booking.start_time, end_time=now, energy_kwh=energy_kwh,
            cost=cost, is_simulated=True, status="completed",
        ))

    db.add(Notification(
        user_id=booking.user_id,
        title=f"Charging completed — EVC-{booking.id:06d}",
        message="Your session is complete. Connector is free for the next customer.",
        is_read=False,
    ))
    db.commit()
    return {"ok": True, "booking_id": booking.id, "status": "completed", "energy_kwh": energy_kwh}


@router.patch("/stations/{station_id}")
def update_station_info(
    station_id: int,
    phone: str = None,
    support_email: str = None,
    support_phone: str = None,
    operating_hours: str = None,
    facilities: str = None,
    status: str = None,
    description: str = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("operator", "admin")),
):
    s = db.query(Station).filter(Station.id == station_id).first()
    if not s:
        raise HTTPException(404, "Station not found")
    if user.role == "operator" and s.operator_id != user.id:
        raise HTTPException(403, "Not your station")
    if phone is not None:
        s.phone = phone
    if support_email is not None:
        s.support_email = support_email
    if support_phone is not None:
        s.support_phone = support_phone
    if operating_hours is not None:
        s.operating_hours = operating_hours
    if facilities is not None:
        s.facilities = facilities
    if status is not None:
        s.status = status
    if description is not None:
        s.description = description
    db.commit()
    return {"id": s.id, "name": s.name, "phone": s.phone, "operating_hours": s.operating_hours, "status": getattr(s, "status", "open")}
