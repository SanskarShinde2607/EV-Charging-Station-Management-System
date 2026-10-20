from pydantic import BaseModel
from typing import List, Optional

class ChargerOut(BaseModel):
    id: int
    label: str
    connector_type: str
    power_kw: float
    price_per_kwh: float
    is_available: bool
    is_faulty: bool
    status: str

    class Config:
        from_attributes = True

class StationOut(BaseModel):
    id: int
    name: str
    address: str
    city: Optional[str] = None
    latitude: float
    longitude: float
    is_active: bool
    operating_hours: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    facilities: Optional[str] = None
    status: Optional[str] = "open"
    chargers: List[ChargerOut] = []
    available_chargers: Optional[int] = None
    distance_km: Optional[float] = None
    travel_time_min: Optional[float] = None

    class Config:
        from_attributes = True

class StationCreate(BaseModel):
    name: str
    address: str
    city: Optional[str] = None
    latitude: float
    longitude: float
    operating_hours: Optional[str] = "06:00-23:00"
    description: Optional[str] = None
    phone: Optional[str] = None
    support_email: Optional[str] = None
    support_phone: Optional[str] = None
    facilities: Optional[str] = None
