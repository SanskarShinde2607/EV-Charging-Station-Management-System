from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.auth import UserCreate, UserLogin, Token, UserOut, ProfileUpdate
from app.services.auth_service import (
    create_user, authenticate_user, create_access_token, get_user_by_email
)
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Public registration — EV owners only. Operators are created by admin."""
    if get_user_by_email(db, user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    # Force role: public signup can only create EV owners
    user_in.role = "ev_owner"
    user = create_user(db, user_in)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return Token(access_token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)




@router.put("/me", response_model=UserOut)
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    for field in ("full_name", "phone", "address", "city", "state", "pincode", "preferred_connector", "company_name"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(user, field, val)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate(user)
