from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.database.session import Base

class UserRole(str, enum.Enum):
    EV_OWNER = "ev_owner"
    OPERATOR = "operator"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), default=UserRole.EV_OWNER.value, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    address = Column(String(255), nullable=True)
    city = Column(String(80), nullable=True)
    state = Column(String(80), nullable=True, default="Maharashtra")
    pincode = Column(String(10), nullable=True)
    company_name = Column(String(150), nullable=True)
    gstin = Column(String(20), nullable=True)
    preferred_connector = Column(String(40), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vehicles = relationship("Vehicle", back_populates="owner", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="user")
    reviews = relationship("Review", back_populates="user")
