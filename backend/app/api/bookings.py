from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import List, Optional
from app.database.session import get_db
from app.models.booking import Booking
from app.models.station import Charger, Station
from app.models.vehicle import Vehicle
from app.models.other import Notification
from app.schemas.booking import (
    BookingCreate, BookingOut, BookingReschedule,
    DurationRequest, DurationOut, SlotRequest, SlotResponse, SlotOption,
)
from app.api.deps import get_current_user
from app.models.user import User
from app.dsa_bridge import get_dsa_bridge
from app.services.allocation import estimate_duration_min, get_busy_intervals, generate_slots

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _ensure_utc(dt):
    """Make datetime timezone-aware (UTC) so conflict checks stay consistent."""
    if dt is None:
        return dt
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt



def _vehicle_reg(db: Session, vehicle_id: Optional[int]):
    if not vehicle_id:
        return None, None
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        return None, None
    return v.license_plate, f"{v.make} {v.model}"


def _booking_out(db: Session, booking: Booking, charger: Charger = None) -> BookingOut:
    ch = charger or booking.charger
    reg, vlabel = _vehicle_reg(db, booking.vehicle_id)
    return BookingOut(
        id=booking.id,
        user_id=booking.user_id,
        charger_id=booking.charger_id,
        vehicle_id=booking.vehicle_id,
        start_time=booking.start_time,
        end_time=booking.end_time,
        status=booking.status,
        estimated_cost=booking.estimated_cost,
        notes=booking.notes,
        created_at=booking.created_at,
        station_name=ch.station.name if ch and ch.station else None,
        charger_label=ch.label if ch else None,
        vehicle_reg=reg,
        vehicle_label=vlabel,
        connector_type=ch.connector_type if ch else None,
        booking_code=f"EVC-{booking.id:06d}",
    )


def _check_conflict(db: Session, charger_id: int, start, end, exclude_booking_id: int = None):
    busy = get_busy_intervals(db, charger_id, exclude_booking_id)
    bridge = get_dsa_bridge()
    if bridge.has_booking_conflict(busy, int(start.timestamp()), int(end.timestamp())):
        raise HTTPException(409, "Time slot conflicts with an existing reservation on this connector")


@router.post("/estimate-duration", response_model=DurationOut)
def estimate_duration(body: DurationRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    v = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id, Vehicle.owner_id == user.id).first()
    if not v:
        raise HTTPException(404, "Vehicle not found")
    c = db.query(Charger).filter(Charger.id == body.charger_id).first()
    if not c:
        raise HTTPException(404, "Charger not found")
    if c.connector_type.lower() != (v.connector_type or "").lower():
        raise HTTPException(400, "Vehicle connector is not compatible with this charger")
    battery = v.battery_capacity_kwh or 40.0
    vmax = v.max_charge_kw or c.power_kw
    energy, eff, dur = estimate_duration_min(battery, body.current_soc, body.target_soc, vmax, c.power_kw)
    cost = round(energy * c.price_per_kwh, 2)
    return DurationOut(
        energy_kwh=energy, duration_min=dur, effective_power_kw=eff, estimated_cost=cost,
        note="Estimate only — actual time varies with temperature, losses and tapering.",
    )


@router.post("/available-slots", response_model=SlotResponse)
def available_slots(body: SlotRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    station = db.query(Station).options(joinedload(Station.chargers)).filter(Station.id == body.station_id, Station.is_active == True).first()
    if not station:
        raise HTTPException(404, "Station not found")
    if getattr(station, "status", "open") in ("closed", "temporary_closed", "unavailable"):
        return SlotResponse(station_id=body.station_id, duration_min=body.duration_min, slots=[], message=f"Station is currently {station.status}")
    v = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id, Vehicle.owner_id == user.id).first()
    if not v:
        raise HTTPException(404, "Vehicle not found")
    if body.date:
        day = datetime.strptime(body.date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        day = datetime.now(timezone.utc)
    raw = generate_slots(db, station, v, body.duration_min, day)
    slots = [SlotOption(**s) for s in raw]
    msg = None if slots else "No compatible connector free today. Join the waiting queue or try another day."
    return SlotResponse(station_id=body.station_id, duration_min=body.duration_min, slots=slots, message=msg)


@router.post("/", response_model=BookingOut, status_code=201)
def create_booking(body: BookingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    body.start_time = _ensure_utc(body.start_time)
    body.end_time = _ensure_utc(body.end_time)
    if body.end_time <= body.start_time:
        raise HTTPException(400, "end_time must be after start_time")
    vehicle = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id, Vehicle.owner_id == user.id).first()
    if not vehicle:
        raise HTTPException(400, "Select a valid vehicle registered to your account")
    if not vehicle.license_plate:
        raise HTTPException(400, "Vehicle must have a registration number (e.g. MH14AB1234)")
    charger = db.query(Charger).options(joinedload(Charger.station)).filter(Charger.id == body.charger_id).first()
    if not charger:
        raise HTTPException(404, "Charger not found")
    if charger.is_faulty or charger.status in ("maintenance", "out_of_service"):
        raise HTTPException(400, "This connector is out of service")
    if charger.connector_type.lower() != vehicle.connector_type.lower():
        raise HTTPException(400, "Incompatible connector for your vehicle")
    station = charger.station
    if station and getattr(station, "status", "open") in ("closed", "temporary_closed", "unavailable"):
        raise HTTPException(400, "Station is not accepting bookings right now")
    _check_conflict(db, body.charger_id, body.start_time, body.end_time)
    duration_h = (body.end_time - body.start_time).total_seconds() / 3600
    est_cost = round(charger.power_kw * duration_h * 0.5 * charger.price_per_kwh, 2)
    booking = Booking(
        user_id=user.id, charger_id=body.charger_id, vehicle_id=body.vehicle_id,
        start_time=body.start_time, end_time=body.end_time, status="confirmed",
        estimated_cost=est_cost, notes=body.notes,
    )
    db.add(booking)
    db.flush()
    db.add(Notification(
        user_id=user.id,
        title=f"Booking EVC-{booking.id:06d} confirmed",
        message=f"Vehicle {vehicle.license_plate} reserved at {station.name if station else 'station'} connector {charger.label}. Show this registration number on arrival.",
        is_read=False,
    ))
    db.commit()
    db.refresh(booking)
    return _booking_out(db, booking, charger)


@router.get("/me", response_model=List[BookingOut])
def my_bookings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bookings = (
        db.query(Booking).options(joinedload(Booking.charger).joinedload(Charger.station))
        .filter(Booking.user_id == user.id).order_by(Booking.start_time.desc()).all()
    )
    return [_booking_out(db, b) for b in bookings]


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(booking_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    booking = (
        db.query(Booking).options(joinedload(Booking.charger).joinedload(Charger.station))
        .filter(Booking.id == booking_id, Booking.user_id == user.id).first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status not in ("confirmed", "pending"):
        raise HTTPException(400, f"Cannot cancel booking with status {booking.status}")
    booking.status = "cancelled"
    if booking.charger and booking.charger.status == "reserved":
        booking.charger.status = "available"
        booking.charger.is_available = True
    db.add(Notification(user_id=user.id, title="Booking cancelled", message=f"Booking EVC-{booking.id:06d} cancelled. Slot released.", is_read=False))
    db.commit()
    db.refresh(booking)
    return _booking_out(db, booking)


@router.put("/{booking_id}/reschedule", response_model=BookingOut)
def reschedule_booking(booking_id: int, body: BookingReschedule, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    body.start_time = _ensure_utc(body.start_time)
    body.end_time = _ensure_utc(body.end_time)
    if body.end_time <= body.start_time:
        raise HTTPException(400, "end_time must be after start_time")
    booking = (
        db.query(Booking).options(joinedload(Booking.charger).joinedload(Charger.station))
        .filter(Booking.id == booking_id, Booking.user_id == user.id).first()
    )
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status not in ("confirmed", "pending"):
        raise HTTPException(400, "Only confirmed/pending bookings can be rescheduled")
    _check_conflict(db, booking.charger_id, body.start_time, body.end_time, exclude_booking_id=booking.id)
    booking.start_time = body.start_time
    booking.end_time = body.end_time
    if booking.charger:
        duration_h = (body.end_time - body.start_time).total_seconds() / 3600
        booking.estimated_cost = round(booking.charger.power_kw * duration_h * 0.5 * booking.charger.price_per_kwh, 2)
    db.commit()
    db.refresh(booking)
    return _booking_out(db, booking)
