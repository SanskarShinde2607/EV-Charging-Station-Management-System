"""Intelligent connector-level slot allocation helpers."""
from datetime import datetime, timedelta, time, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.station import Station, Charger
from app.models.booking import Booking
from app.models.vehicle import Vehicle
from app.dsa_bridge import get_dsa_bridge

TURNAROUND_MIN = 5  # minutes between sessions
GRACE_MIN = 15
SLOT_STEP_MIN = 15


def parse_hours(hours_str: str) -> Tuple[time, time]:
    """Parse '06:00-23:00' into open/close times. Default full day if invalid."""
    try:
        a, b = hours_str.split("-")
        oh, om = map(int, a.strip().split(":"))
        ch, cm = map(int, b.strip().split(":"))
        return time(oh, om), time(ch, cm)
    except Exception:
        return time(6, 0), time(23, 0)


def estimate_duration_min(
    battery_kwh: float,
    current_soc: float,
    target_soc: float,
    vehicle_max_kw: float,
    charger_kw: float,
) -> Tuple[float, float, int]:
    """
    Energy needed = capacity * (target - current) / 100
    Effective power = min(vehicle_max, charger) * 0.9 (losses)
    Returns energy_kwh, effective_kw, duration_min
    """
    if target_soc <= current_soc:
        target_soc = min(100.0, current_soc + 10)
    energy = max(0.1, battery_kwh * (target_soc - current_soc) / 100.0)
    eff = max(1.0, min(vehicle_max_kw or charger_kw, charger_kw) * 0.9)
    hours = energy / eff
    duration = max(15, int(round(hours * 60 / SLOT_STEP_MIN) * SLOT_STEP_MIN))
    return round(energy, 2), round(eff, 2), duration


def get_busy_intervals(db: Session, charger_id: int, exclude_booking_id: int = None) -> List[Tuple[int, int]]:
    q = db.query(Booking).filter(
        Booking.charger_id == charger_id,
        Booking.status.in_(["confirmed", "pending", "arrived", "charging"]),
    )
    if exclude_booking_id:
        q = q.filter(Booking.id != exclude_booking_id)
    rows = q.all()
    intervals = []
    for b in rows:
        start = int(b.start_time.timestamp())
        # include turnaround after end
        end = int(b.end_time.timestamp()) + TURNAROUND_MIN * 60
        intervals.append((start, end))
    return intervals


def generate_slots(
    db: Session,
    station: Station,
    vehicle: Vehicle,
    duration_min: int,
    day: datetime,
    max_slots: int = 12,
) -> List[dict]:
    """Earliest available slots per compatible connector for a given day."""
    open_t, close_t = parse_hours(station.operating_hours or "06:00-23:00")
    day_start = datetime.combine(day.date(), open_t).replace(tzinfo=timezone.utc)
    day_end = datetime.combine(day.date(), close_t).replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    if day_start < now:
        # round up to next slot step
        mins = ((now.minute // SLOT_STEP_MIN) + 1) * SLOT_STEP_MIN
        if mins >= 60:
            candidate = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
        else:
            candidate = now.replace(minute=0, second=0, microsecond=0) + timedelta(minutes=mins)
        if candidate > day_start:
            day_start = candidate

    chargers = [
        c for c in station.chargers
        if not c.is_faulty
        and c.status not in ("maintenance", "out_of_service")
        and c.connector_type.lower() == (vehicle.connector_type or "").lower()
    ]
    bridge = get_dsa_bridge()
    slots = []
    duration_sec = duration_min * 60

    for c in chargers:
        busy = get_busy_intervals(db, c.id)
        t = int(day_start.timestamp())
        end_limit = int(day_end.timestamp())
        found = 0
        while t + duration_sec <= end_limit and found < 4:
            if not bridge.has_booking_conflict(busy, t, t + duration_sec):
                start_dt = datetime.fromtimestamp(t, tz=timezone.utc)
                end_dt = datetime.fromtimestamp(t + duration_sec, tz=timezone.utc)
                slots.append({
                    "charger_id": c.id,
                    "charger_label": c.label,
                    "connector_type": c.connector_type,
                    "power_kw": c.power_kw,
                    "price_per_kwh": c.price_per_kwh,
                    "start_time": start_dt,
                    "end_time": end_dt,
                })
                found += 1
            t += SLOT_STEP_MIN * 60

    slots.sort(key=lambda s: s["start_time"])
    return slots[:max_slots]
