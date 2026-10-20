from pydantic import BaseModel
from typing import List, Optional

class RecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    connector_type: Optional[str] = None
    max_distance_km: float = 30.0
    min_power_kw: Optional[float] = None
    max_price: Optional[float] = None
    available_only: bool = False
    duration_min: int = 30
    vehicle_id: Optional[int] = None
    w_distance: float = 0.30
    w_time: float = 0.35
    w_wait: float = 0.20
    w_cost: float = 0.15

class RankedStationOut(BaseModel):
    station_id: int
    name: str
    address: str
    latitude: float
    longitude: float
    score: float
    distance_km: float
    travel_time_min: float
    waiting_time_min: float
    cost_per_kwh: float
    available_chargers: int
    connector_types: List[str]
    power_kw_max: float
    explanation: Optional[str] = None
    city: Optional[str] = None
