from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_user, get_db

router = APIRouter()


# Данные пользователя для отображения
class AdminUserOut(BaseModel):
    id: int
    email: str
    token_balance: int
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# Информация о транзакции
class AdminTransactionOut(BaseModel):
    id: int
    user_id: int
    amount_currency: float
    tokens: int
    currency: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# Текущие настройки биллинга
class SettingsOut(BaseModel):
    currency: str
    token_rate: float


# Входные данные для обновления настроек
class SettingsUpdate(BaseModel):
    currency: str = Field(..., min_length=1)
    token_rate: float = Field(..., gt=0)


# Проверка прав администратора
def require_admin(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Требуются права администратора",
        )
    return current_user


# Получить список всех пользователей
@router.get("/users", response_model=List[AdminUserOut])
def list_users(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return users


# Получить список всех транзакций
@router.get("/transactions", response_model=List[AdminTransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    transactions = (
        db.query(models.Transaction)
        .order_by(models.Transaction.created_at.desc())
        .all()
    )
    return transactions


# Получить текущие настройки
@router.get("/settings", response_model=SettingsOut)
def get_settings(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    settings = db.query(models.Settings).first()
    if settings is None:
        settings = models.Settings(currency="TEST", token_rate=1.0)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return SettingsOut(currency=settings.currency, token_rate=settings.token_rate)


# Обновить курс токена и валюту для новых пополнений
@router.post("/settings", response_model=SettingsOut)
def update_settings(
    body: SettingsUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
):
    settings = db.query(models.Settings).first()
    if settings is None:
        settings = models.Settings()
        db.add(settings)

    settings.currency = body.currency
    settings.token_rate = body.token_rate

    db.commit()
    db.refresh(settings)

    return SettingsOut(currency=settings.currency, token_rate=settings.token_rate)
