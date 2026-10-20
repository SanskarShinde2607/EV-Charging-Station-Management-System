from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base, SessionLocal
from app.api import auth, stations, bookings, recommendations, vehicles, notifications, operator, admin, reviews, queue_api, favorites, support, public_stats, reports
from app.models import User, Station, Charger, Vehicle
from app.models.other import Notification
from app.models.extra import WaitingQueueEntry, Favorite, AuditLog
from app.models.support import SupportTicket
from app.services.auth_service import hash_password

app = FastAPI(
    title="EV Charge API",
    description="Station discovery, smart recommendations, bookings, operator tools and network admin for Maharashtra",
    version="1.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(stations.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(vehicles.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(operator.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(queue_api.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(support.router, prefix="/api")
app.include_router(public_stats.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


def seed_data():
    """Insert sample stations, chargers and demo users if DB is empty."""
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            # Repair: ensure stations have an operator so partner dashboard shows bookings
            op = db.query(User).filter(User.role == "operator", User.email == "operator@evcharge.com").first()
            if op:
                orphan = db.query(Station).filter(Station.operator_id.is_(None)).all()
                if orphan:
                    for s in orphan:
                        s.operator_id = op.id
                    db.commit()
                    print(f"Assigned {len(orphan)} stations to operator@evcharge.com")
            return

        owner = User(
            email="owner@evcharge.com",
            hashed_password=hash_password("password123"),
            full_name="Rahul Sharma",
            role="ev_owner",
            is_active=True,
            is_verified=True,
        )
        operator_user = User(
            email="operator@evcharge.com",
            hashed_password=hash_password("password123"),
            full_name="Priya Patil",
            role="operator",
            is_active=True,
            is_verified=True,
        )
        admin_user = User(
            email="admin@evcharge.com",
            hashed_password=hash_password("password123"),
            full_name="Admin Maharashtra",
            role="admin",
            is_active=True,
            is_verified=True,
        )
        operator2 = User(
            email="operator2@evcharge.com",
            hashed_password=hash_password("password123"),
            full_name="Amit Deshmukh",
            role="operator",
            is_active=True,
            is_verified=True,
        )
        db.add_all([owner, operator_user, operator2, admin_user])
        db.flush()

        sample_stations = [
            # Pune metro
            ("GreenCharge FC Road", "FC Road, Shivajinagar, Pune", "Pune", 18.5286, 73.8478),
            ("VoltHub Koregaon Park", "North Main Road, Koregaon Park", "Pune", 18.5362, 73.8938),
            ("EcoPlug Hinjewadi", "Rajiv Gandhi Infotech Park, Hinjewadi Phase 1", "Pune", 18.5912, 73.7389),
            ("PowerBay Kothrud", "Paud Road, Kothrud", "Pune", 18.5074, 73.8077),
            ("ChargePoint Baner", "Baner Road, Baner", "Pune", 18.5590, 73.7868),
            ("SwiftCharge Hadapsar", "Magarpatta Road, Hadapsar", "Pune", 18.5089, 73.9260),
            ("AmpStation Viman Nagar", "Nagar Road, Viman Nagar", "Pune", 18.5679, 73.9143),
            ("NexCharge Wakad", "Mumbai-Bangalore Highway, Wakad", "Pune", 18.5995, 73.7625),
            # Other Maharashtra cities
            ("MH Charge Deccan", "JM Road, Deccan Gymkhana, Pune", "Pune", 18.5167, 73.8412),
            ("CoastalCharge Marine Drive", "Netaji Subhash Chandra Bose Road, Mumbai", "Mumbai", 18.9432, 72.8236),
            ("Nashik EV Hub", "College Road, Nashik", "Nashik", 19.9975, 73.7898),
            ("Nagpur Power Bay", "Sitabuldi, Nagpur", "Nagpur", 21.1498, 79.0806),
        ]

        connectors = [
            [("CCS", 60, 14.5), ("Type2", 22, 11.0)],
            [("CCS", 50, 13.0), ("CHAdeMO", 50, 13.0), ("Type2", 11, 10.0)],
            [("CCS", 120, 16.0), ("Type2", 22, 12.0)],
            [("CCS", 60, 14.0), ("Type2", 22, 11.5)],
            [("Type2", 22, 10.5), ("CCS", 50, 13.5)],
            [("CCS", 150, 18.0), ("CCS", 60, 15.0)],
            [("Type2", 11, 9.5), ("CCS", 50, 12.5)],
            [("CCS", 60, 14.0), ("CHAdeMO", 50, 13.0), ("Type2", 22, 11.0)],
            [("CCS", 60, 13.5), ("Type2", 22, 11.0)],
            [("CCS", 120, 17.0), ("Type2", 22, 12.5)],
            [("CCS", 50, 12.0), ("Type2", 11, 10.0)],
            [("CCS", 60, 13.0), ("CHAdeMO", 50, 12.5)],
        ]

        for i, (name, addr, city, lat, lon) in enumerate(sample_stations):
            op_id = operator_user.id if i < 9 else operator2.id
            st = Station(
                name=name, address=addr, city=city,
                latitude=lat, longitude=lon,
                operator_id=op_id,
                is_active=True, operating_hours="06:00-23:00",
                description=f"Maharashtra EV charging — {name}, {city}",
                phone="+91 20 4000 1000",
                support_email="support@evcharge.mh",
                support_phone="+91 20 4000 1001",
                facilities="Parking, CCTV, Restroom, Cafe nearby",
                status="open",
            )
            db.add(st)
            db.flush()
            for j, (conn, power, price) in enumerate(connectors[i]):
                ch = Charger(
                    station_id=st.id, label=f"{chr(65 + j)}{j + 1}",
                    connector_type=conn, power_kw=power, price_per_kwh=price,
                    is_available=True, is_faulty=False, status="available",
                )
                db.add(ch)

        v = Vehicle(
            owner_id=owner.id, make="Tata", model="Nexon EV", year=2024,
            connector_type="CCS", battery_capacity_kwh=40.5, max_charge_kw=50,
            license_plate="MH12AB1234", is_default=True,
        )
        db.add(v)

        db.add(Notification(
            user_id=owner.id,
            title="Welcome to EV Charge",
            message="Your account is ready. Explore stations near you and book a slot.",
            is_read=False,
        ))
        db.add(Notification(
            user_id=operator_user.id,
            title="Operator dashboard ready",
            message="You can manage chargers, bookings and fault reports for your stations.",
            is_read=False,
        ))

        db.commit()
        print("Seed data inserted successfully.")
    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    seed_data()


@app.get("/")
def root():
    return {
        "name": "EV Charge API",
        "version": "1.4.0",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
