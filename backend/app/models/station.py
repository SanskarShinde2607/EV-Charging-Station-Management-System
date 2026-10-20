from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(80), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    operating_hours = Column(String(100), default="06:00-23:00")
    description = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    support_email = Column(String(120), nullable=True)
    support_phone = Column(String(30), nullable=True)
    facilities = Column(Text, nullable=True)  # free text / comma list
    status = Column(String(30), default="open")  # open, closed, temporary_closed, unavailable
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chargers = relationship("Charger", back_populates="station", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="station")

class Charger(Base):
    __tablename__ = "chargers"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    label = Column(String(40), nullable=False)
    connector_type = Column(String(40), nullable=False)
    power_kw = Column(Float, nullable=False)
    price_per_kwh = Column(Float, nullable=False, default=12.0)
    is_available = Column(Boolean, default=True)
    is_faulty = Column(Boolean, default=False)
    # available | reserved | charging | maintenance | awaiting_release
    status = Column(String(30), default="available")

    station = relationship("Station", back_populates="chargers")
    bookings = relationship("Booking", back_populates="charger")
