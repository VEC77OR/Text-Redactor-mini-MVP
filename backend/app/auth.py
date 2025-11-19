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

# Настройки JWT
SECRET_KEY = "CHANGE_ME_TO_SOMETHING_SECURE"  # необходимо заменить на что-то нормальное и вынести в .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login") # откуда брать токен при авторизации

router = APIRouter()

# Входные данные для регистрации
class UserCreate(BaseModel):
    email: EmailStr = Field(..., min_length=3)
    password: str = Field(..., min_length=4)


# Данные пользователя, которые возвращаются
class UserRead(BaseModel):
    id: int
    email: str
    token_balance: int
    is_admin: bool

    model_config = {
        "from_attributes": True
    }


# Ответ при успешном логине
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# DB сессия
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Возвращает хеш пароля с помощью Argon2
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Проверяет, совпадает ли введённый пароль с хешем из DB
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# Создаёт JWT-токен
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Получение текущего пользователя по токену
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
        # Попытка декодировать и проверить токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            # Нет sub → токен некорректен
            raise credentials_exception
        try:
            user_id = int(user_id)
        except ValueError:
            # sub не преобразуется в int → тоже считаем токен некорректным
            raise credentials_exception
    except JWTError:
        # Любая ошибка JWT (истёк, подпись неверна и т.п.)
        raise credentials_exception

    # Ищем пользователя в базе
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        # Пользователь не найден
        raise credentials_exception
    return user


# Регистрация нового пользователя
@router.post("/register", response_model=UserRead)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if not user_in.email.strip():
        raise HTTPException(status_code=400, detail="Email не может быть пустым")
    
    if not user_in.password.strip():
        raise HTTPException(status_code=400, detail="Пароль не может быть пустым")

    # Проверяем, что email ещё не занят
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    # Создаём нового пользователя
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


# Логин пользователя
@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Ищем пользователя 
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    # Проверяем существование и корректность пароля
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    # Создаём access-токен с user_id в поле "sub"
    access_token = create_access_token({"sub": str(user.id)})
    return Token(access_token=access_token)


# Возвращает информацию о текущем авторизованном пользователе
@router.get("/me", response_model=UserRead)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

