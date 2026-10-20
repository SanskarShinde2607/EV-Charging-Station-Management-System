from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone: Optional[str] = None
    role: str = "ev_owner"
    address: Optional[str] = None
    city: Optional[str] = "Pune"
    state: Optional[str] = "Maharashtra"
    pincode: Optional[str] = None
    preferred_connector: Optional[str] = None
    company_name: Optional[str] = None
    gstin: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    is_verified: Optional[bool] = False
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    preferred_connector: Optional[str] = None
    company_name: Optional[str] = None
    gstin: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    preferred_connector: Optional[str] = None
    company_name: Optional[str] = None
