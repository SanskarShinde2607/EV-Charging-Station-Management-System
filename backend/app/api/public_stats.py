from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.station import Station, Charger
from app.models.booking import Booking
from app.models.user import User
from app.models.vehicle import Vehicle

router = APIRouter(prefix="/public", tags=["Public Dashboard"])

@router.get("/dashboard")
def public_dashboard(db: Session = Depends(get_db)):
    """Open stats for homepage / public dashboard — no login required."""
    stations = db.query(Station).filter(Station.is_active == True).count()
    chargers = db.query(Charger).count()
    available = db.query(Charger).filter(Charger.is_available == True, Charger.is_faulty == False).count()
    bookings = db.query(Booking).filter(Booking.status.in_(["confirmed", "completed", "charging", "arrived"])).count()
    owners = db.query(User).filter(User.role == "ev_owner", User.is_active == True).count()
    operators = db.query(User).filter(User.role == "operator", User.is_active == True).count()
    cities = [r[0] for r in db.query(Station.city).filter(Station.city.isnot(None)).distinct().all()]

    by_city = []
    for city in cities:
        sc = db.query(Station).filter(Station.city == city, Station.is_active == True).count()
        by_city.append({"city": city, "stations": sc})

    connectors = {}
    for c in db.query(Charger).all():
        connectors[c.connector_type] = connectors.get(c.connector_type, 0) + 1

    return {
        "network_name": "EV Charge Maharashtra",
        "stations": stations,
        "chargers": chargers,
        "available_chargers": available,
        "total_bookings": bookings,
        "registered_drivers": owners,
        "operators": operators,
        "cities": by_city,
        "connector_mix": connectors,
        "coverage": "Pune, Mumbai, Nashik, Nagpur",
        "tagline": "Find, book, and charge across Maharashtra",
    }
