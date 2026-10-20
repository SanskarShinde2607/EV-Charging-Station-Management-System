from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class BookingCreate(BaseModel):
    charger_id: int
    vehicle_id: int
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None
    current_soc: Optional[float] = Field(None, ge=0, le=100)
    target_soc: Optional[float] = Field(None, ge=0, le=100)

class BookingReschedule(BaseModel):
    start_time: datetime
    end_time: datetime

class BookingOut(BaseModel):
    id: int
    user_id: int
    charger_id: int
    vehicle_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    status: str
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    station_name: Optional[str] = None
    charger_label: Optional[str] = None
    vehicle_reg: Optional[str] = None
    vehicle_label: Optional[str] = None
    connector_type: Optional[str] = None
    booking_code: Optional[str] = None

    class Config:
        from_attributes = True

class DurationRequest(BaseModel):
    vehicle_id: int
    charger_id: int
    current_soc: float = Field(20, ge=0, le=100)
    target_soc: float = Field(80, ge=0, le=100)

class DurationOut(BaseModel):
    energy_kwh: float
    duration_min: int
    effective_power_kw: float
    estimated_cost: float
    note: str

class SlotRequest(BaseModel):
    station_id: int
    vehicle_id: int
    duration_min: int = 60
    date: Optional[str] = None

class SlotOption(BaseModel):
    charger_id: int
    charger_label: str
    connector_type: str
    power_kw: float
    price_per_kwh: float
    start_time: datetime
    end_time: datetime

class SlotResponse(BaseModel):
    station_id: int
    duration_min: int
    slots: List[SlotOption]
    message: Optional[str] = None
