from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("/me", response_model=List[VehicleOut])
def my_vehicles(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).filter(Vehicle.owner_id == user.id).all()
    return [VehicleOut.model_validate(v) for v in vehicles]

@router.post("/", response_model=VehicleOut, status_code=201)
def create_vehicle(
    body: VehicleCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    plate = (body.license_plate or "").strip().upper().replace(" ", "")
    if len(plate) < 4:
        raise HTTPException(400, "Registration number is required (e.g. MH14AB1234)")
    body.license_plate = plate
    if body.is_default:
        db.query(Vehicle).filter(Vehicle.owner_id == user.id).update({"is_default": False})
    v = Vehicle(owner_id=user.id, **body.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return VehicleOut.model_validate(v)

@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    body: VehicleUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.owner_id == user.id).first()
    if not v:
        raise HTTPException(404, "Vehicle not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("is_default"):
        db.query(Vehicle).filter(Vehicle.owner_id == user.id).update({"is_default": False})
    for k, val in data.items():
        setattr(v, k, val)
    db.commit()
    db.refresh(v)
    return VehicleOut.model_validate(v)

@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.owner_id == user.id).first()
    if not v:
        raise HTTPException(404, "Vehicle not found")
    db.delete(v)
    db.commit()
