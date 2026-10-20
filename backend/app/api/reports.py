from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict
from app.database.session import get_db
from app.models.station import Station, Charger
from app.models.booking import Booking
from app.models.user import User
from app.models.support import SupportTicket
from app.api.deps import require_role
from app.models.user import User as UserModel

router = APIRouter(prefix="/reports", tags=["Business Insights"])

@router.get("/operator")
def operator_report(db: Session = Depends(get_db), user: UserModel = Depends(require_role("operator", "admin"))):
    q = db.query(Station)
    if user.role == "operator":
        q = q.filter(Station.operator_id == user.id)
    stations = q.all()
    sids = [s.id for s in stations]
    chargers = db.query(Charger).filter(Charger.station_id.in_(sids)).all() if sids else []
    cids = [c.id for c in chargers]
    bookings = db.query(Booking).filter(Booking.charger_id.in_(cids)).all() if cids else []

    by_status = defaultdict(int)
    revenue = 0.0
    for b in bookings:
        by_status[b.status] += 1
        if b.status in ("confirmed", "completed", "charging", "arrived") and b.estimated_cost:
            revenue += b.estimated_cost

    by_station = []
    for s in stations:
        sc = [c for c in chargers if c.station_id == s.id]
        sb = [b for b in bookings if b.charger_id in {c.id for c in sc}]
        rev = sum(b.estimated_cost or 0 for b in sb if b.status in ("confirmed", "completed", "charging"))
        by_station.append({
            "station": s.name, "city": s.city,
            "chargers": len(sc), "available": sum(1 for c in sc if c.is_available and not c.is_faulty),
            "bookings": len(sb), "revenue": round(rev, 2),
            "utilization_pct": round(100 * (1 - sum(1 for c in sc if c.is_available) / len(sc)), 1) if sc else 0,
        })

    return {
        "role": user.role,
        "summary": {
            "stations": len(stations),
            "chargers": len(chargers),
            "bookings": len(bookings),
            "estimated_revenue": round(revenue, 2),
            "by_status": dict(by_status),
        },
        "by_station": by_station,
        "insights": [
            "Revenue is estimated from booking duration × tariff (demo).",
            "Utilization approximates busy connectors vs total.",
            "Focus maintenance on stations with high bookings and low availability.",
        ],
    }

@router.get("/admin")
def admin_report(db: Session = Depends(get_db), admin: UserModel = Depends(require_role("admin"))):
    users = db.query(User).count()
    by_role = dict(db.query(User.role, func.count(User.id)).group_by(User.role).all())
    stations = db.query(Station).count()
    active_stations = db.query(Station).filter(Station.is_active == True).count()
    chargers = db.query(Charger).count()
    bookings = db.query(Booking).all()
    by_status = defaultdict(int)
    revenue = 0.0
    for b in bookings:
        by_status[b.status] += 1
        if b.estimated_cost and b.status in ("confirmed", "completed", "charging", "arrived"):
            revenue += b.estimated_cost
    tickets = db.query(SupportTicket).count()
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "open").count()

    city_stats = []
    cities = db.query(Station.city).distinct().all()
    for (city,) in cities:
        if not city:
            continue
        st = db.query(Station).filter(Station.city == city).count()
        city_stats.append({"city": city, "stations": st})

    return {
        "summary": {
            "users": users,
            "by_role": by_role,
            "stations": stations,
            "active_stations": active_stations,
            "chargers": chargers,
            "bookings": len(bookings),
            "estimated_revenue": round(revenue, 2),
            "booking_status": dict(by_status),
            "support_tickets": tickets,
            "open_tickets": open_tickets,
        },
        "cities": city_stats,
        "insights": [
            "Admin view covers network-wide KPIs for Maharashtra.",
            "Open support tickets need response within SLA (define in ops policy).",
            "Operators can be created only from Admin → Operators.",
        ],
    }
