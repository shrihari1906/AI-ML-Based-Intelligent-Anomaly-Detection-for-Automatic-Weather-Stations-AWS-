"""
Security & User Authentication (JWT & Password Hashing).
Implements token issuance, bearer authentication, password hashing, and user management.
"""

import os
import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.database import get_db, SessionLocal
from backend.models import User

router = APIRouter(prefix="/api/auth", tags=["Security & Authentication"])

JWT_SECRET = os.getenv("JWT_SECRET", "aws_monitor_secure_super_secret_jwt_key_2026")
JWT_EXPIRATION_SEC = 86400 * 7 # 7 days


# --- Cryptographic Helpers ---
def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with dynamic salt."""
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against PBKDF2-HMAC-SHA256 hashed string."""
    try:
        salt, key_hex = hashed_password.split("$")
        check_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), 100000)
        return hmac.compare_digest(check_key.hex(), key_hex)
    except Exception:
        return False


def create_jwt_token(payload: Dict[str, Any]) -> str:
    """Generate self-contained standard JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload_copy = payload.copy()
    payload_copy["exp"] = int(time.time()) + JWT_EXPIRATION_SEC
    payload_copy["iat"] = int(time.time())

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload_copy).encode()).decode().rstrip("=")
    
    signature = hmac.new(
        JWT_SECRET.encode(),
        f"{header_b64}.{payload_b64}".encode(),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode JWT signature."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        # Verify signature
        expected_sig = hmac.new(
            JWT_SECRET.encode(),
            f"{header_b64}.{payload_b64}".encode(),
            hashlib.sha256
        ).digest()
        expected_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip("=")
        
        if not hmac.compare_digest(sig_b64, expected_b64):
            return None
        
        # Decode payload
        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += "=" * (4 - rem)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
        
        if payload.get("exp", 0) < time.time():
            return None # Expired
            
        return payload
    except Exception:
        return None


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    """Dependency extracting authenticated user from Bearer header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer authentication token."
        )
    token = authorization.split(" ")[1]
    payload = decode_jwt_token(token)
    if not payload or "username" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token expired or invalid."
        )
    
    user = db.query(User).filter(User.username == payload["username"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive.")
    return user


# --- Request / Response Schemas ---
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = "Abhishek"
    role: Optional[str] = "admin"


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    user: Dict[str, Any]


# --- API Routes ---
@router.post("/register", response_model=AuthResponse)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new operator or admin user."""
    existing = db.query(User).filter((User.username == req.username) | (User.email == req.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered.")

    new_user = User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name or req.username,
        role=req.role or "admin",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_jwt_token({"user_id": new_user.id, "username": new_user.username, "role": new_user.role})
    return {
        "token": token,
        "token_type": "Bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
        }
    }


@router.post("/login", response_model=AuthResponse)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with username/password to receive JWT token."""
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_jwt_token({"user_id": user.id, "username": user.username, "role": user.role})
    return {
        "token": token,
        "token_type": "Bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }
    }


@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user profile."""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
    }


def seed_default_admin():
    """Ensure default 'Abhishek' admin user exists in DB."""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "abhishek").first()
        if not admin:
            admin = User(
                username="abhishek",
                email="abhishek@aws-monitor.ai",
                hashed_password=hash_password("admin123"),
                full_name="Abhishek",
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("[AUTH] Default admin profile 'Abhishek' created.")
    except Exception as e:
        print(f"[AUTH ERR] {e}")
    finally:
        db.close()
