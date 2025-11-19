from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app import models
from app.auth import get_current_user, get_db


router = APIRouter()


class TopupRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Сумма в валюте")


class TopupResponse(BaseModel):
    tokens_added: int
    new_balance: int


@router.post("/topup", response_model=TopupResponse)
def topup(
    body: TopupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # получаем/создаём настройки
    settings = db.query(models.Settings).first()
    if settings is None:
        settings = models.Settings(currency="TEST", token_rate=1.0)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # 1 токен = settings.token_rate единиц валюты
    tokens = int(body.amount / settings.token_rate)

    if tokens <= 0:
        raise HTTPException(
            status_code=400,
            detail="Сумма слишком мала, чтобы приобрести хотя бы 1 токен",
        )

    tx = models.Transaction(
        user_id=current_user.id,
        amount_currency=body.amount,
        tokens=tokens,
        currency=settings.currency,
        status="success",
    )

    current_user.token_balance += tokens

    db.add(tx)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return TopupResponse(
        tokens_added=tokens,
        new_balance=current_user.token_balance,
    )
