from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.session import Base

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    charger_id = Column(Integer, ForeignKey("chargers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(30), default="confirmed")  # pending, confirmed, cancelled, completed, no_show, expired
    estimated_cost = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="bookings")
    charger = relationship("Charger", back_populates="bookings")
    session = relationship("ChargingSession", back_populates="booking", uselist=False)

class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    charger_id = Column(Integer, ForeignKey("chargers.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    energy_kwh = Column(Float, default=0.0)
    cost = Column(Float, default=0.0)
    is_simulated = Column(Boolean, default=True)
    status = Column(String(30), default="pending")  # pending, active, completed, interrupted

    booking = relationship("Booking", back_populates="session")
