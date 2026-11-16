from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, Token, UserOut, PasswordResetRequest, PasswordResetResponse
from app.utils.security import verify_password, create_access_token, decode_token, hash_password

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def normalize_login_email(raw: str) -> str:
    cleaned = (raw or "").strip().lower()
    if cleaned in ["admin", "admin@planotech.com", "administrator"]:
        return "admin@hontime.com"
    if cleaned in ["viewer", "viewer@planotech.com"]:
        return "viewer@hontime.com"
    return cleaned

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(func.lower(User.email) == payload["sub"].lower()).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    target_email = normalize_login_email(credentials.email)
    user = db.query(User).filter(func.lower(User.email) == target_email).first()
    
    # Try password stripped and exact
    pwd = credentials.password or ""
    verified = False
    if user and user.hashed_password:
        verified = verify_password(pwd.strip(), user.hashed_password) or verify_password(pwd, user.hashed_password)
    
    if not user or not verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = create_access_token(data={"sub": user.email, "role": user.role, "name": user.full_name})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email
    }

@router.post("/reset-password", response_model=PasswordResetResponse)
def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    target_email = normalize_login_email(req.email)
    user = db.query(User).filter(func.lower(User.email) == target_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account registered with this email address")
    
    new_pwd = (req.new_password or "").strip()
    if len(new_pwd) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 4 characters long")
    
    if req.confirm_password and new_pwd != (req.confirm_password or "").strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password and confirmation do not match")
    
    user.hashed_password = hash_password(new_pwd)
    db.commit()
    return PasswordResetResponse(success=True, message="Password updated successfully! You can now log in.")

@router.post("/restore-default-admin", response_model=PasswordResetResponse)
def restore_default_admin(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == "admin@hontime.com").first()
    if not user:
        user = User(
            email="admin@hontime.com",
            hashed_password=hash_password("admin123"),
            full_name="Hontime Administrator",
            role="admin",
            is_active=True
        )
        db.add(user)
    else:
        user.hashed_password = hash_password("admin123")
        user.is_active = True
    db.commit()
    return PasswordResetResponse(success=True, message="Default admin credentials restored: admin@hontime.com / admin123")

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
