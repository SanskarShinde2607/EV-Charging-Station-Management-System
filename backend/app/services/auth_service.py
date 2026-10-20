from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.auth import UserCreate
import os
import hashlib
import secrets

SECRET_KEY = os.getenv("SECRET_KEY", "ev-charge-dev-secret-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def hash_password(password: str) -> str:
    """SHA-256 + salt (demo-friendly; use bcrypt/argon2 in production)."""
    salt = secrets.token_hex(16)
    digest = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${digest}"

def verify_password(plain: str, hashed: str) -> bool:
    try:
        salt, digest = hashed.split("$", 1)
        return hashlib.sha256((salt + plain).encode()).hexdigest() == digest
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_in) -> User:
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        phone=getattr(user_in, "phone", None),
        role=getattr(user_in, "role", "ev_owner") or "ev_owner",
        address=getattr(user_in, "address", None),
        city=getattr(user_in, "city", None) or "Pune",
        state=getattr(user_in, "state", None) or "Maharashtra",
        pincode=getattr(user_in, "pincode", None),
        preferred_connector=getattr(user_in, "preferred_connector", None),
        company_name=getattr(user_in, "company_name", None),
        gstin=getattr(user_in, "gstin", None),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user
