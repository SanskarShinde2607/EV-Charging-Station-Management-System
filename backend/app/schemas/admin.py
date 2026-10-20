from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PlatformStats(BaseModel):
    total_users: int
    total_operators: int
    total_stations: int
    total_chargers: int
    total_bookings: int
    active_bookings: int
    open_faults: int

class UserAdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FaultReportOut(BaseModel):
    id: int
    charger_id: int
    reported_by: int
    description: str
    severity: str
    status: str
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    charger_label: Optional[str] = None
    station_name: Optional[str] = None

    class Config:
        from_attributes = True

class FaultReportCreate(BaseModel):
    charger_id: int
    description: str
    severity: str = "medium"

class NotificationOut(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OperatorStationOut(BaseModel):
    id: int
    name: str
    address: str
    city: Optional[str] = None
    latitude: float
    longitude: float
    is_active: bool
    operating_hours: Optional[str] = None
    charger_count: int = 0
    available_count: int = 0

    class Config:
        from_attributes = True

class ChargerUpdate(BaseModel):
    is_available: Optional[bool] = None
    is_faulty: Optional[bool] = None
    status: Optional[str] = None
    price_per_kwh: Optional[float] = None
    power_kw: Optional[float] = None
