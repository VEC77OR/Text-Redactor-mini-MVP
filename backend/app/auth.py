from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app import models
from pydantic import BaseModel, EmailStr, Field

# ===== Настройки JWT =====
SECRET_KEY = "CHANGE_ME_TO_SOMETHING_SECURE"  # потом вынесешь в .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter()

# ===== Pydantic-схемы =====
class UserCreate(BaseModel):
    email: EmailStr = Field(..., min_length=3)
    password: str = Field(..., min_length=4)
    
class UserRead(BaseModel):
    id: int
    email: str
    token_balance: int
    is_admin: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ===== DB сессия =====
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===== Хэш пароля =====
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ===== JWT =====
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ===== Текущий пользователь по токену =====
def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить токен",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        try:
            user_id = int(user_id)
        except ValueError:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

# ===== Эндпоинты auth =====

@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if not user_in.email.strip():
    	raise HTTPException(status_code=400, detail="Email не может быть пустым")

    if not user_in.password.strip():
        raise HTTPException(status_code=400, detail="Пароль не может быть пустым")

    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    user = models.User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        token_balance=0,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    access_token = create_access_token({"sub": str(user.id)})
    return Token(access_token=access_token)

@router.get("/me", response_model=UserRead)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

