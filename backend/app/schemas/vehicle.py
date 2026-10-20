from pydantic import BaseModel, Field
from typing import Optional

class VehicleCreate(BaseModel):
    make: str
    model: str
    year: Optional[int] = None
    connector_type: str
    battery_capacity_kwh: Optional[float] = None
    max_charge_kw: Optional[float] = None
    license_plate: str = Field(..., min_length=4, max_length=20)
    is_default: bool = False

class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    connector_type: Optional[str] = None
    battery_capacity_kwh: Optional[float] = None
    max_charge_kw: Optional[float] = None
    license_plate: Optional[str] = None
    is_default: Optional[bool] = None

class VehicleOut(BaseModel):
    id: int
    owner_id: int
    make: str
    model: str
    year: Optional[int] = None
    connector_type: str
    battery_capacity_kwh: Optional[float] = None
    max_charge_kw: Optional[float] = None
    license_plate: Optional[str] = None
    is_default: bool = False

    class Config:
        from_attributes = True
