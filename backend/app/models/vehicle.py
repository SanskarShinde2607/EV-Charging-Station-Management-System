from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    make = Column(String(80), nullable=False)
    model = Column(String(80), nullable=False)
    year = Column(Integer, nullable=True)
    connector_type = Column(String(40), nullable=False)  # CCS, CHAdeMO, Type2, Tesla
    battery_capacity_kwh = Column(Float, nullable=True)
    max_charge_kw = Column(Float, nullable=True)
    license_plate = Column(String(20), nullable=True)
    is_default = Column(Boolean, default=False)

    owner = relationship("User", back_populates="vehicles")
