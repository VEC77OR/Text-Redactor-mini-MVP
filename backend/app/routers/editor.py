# app/routers/editor.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import SessionLocal
from app import models
from app.llm import edit_text
from app.auth import get_current_user, get_db

router = APIRouter()


class EditRequest(BaseModel):
    text: str
    operation: str  # "paraphrase" | "fix" | "shorten"


class EditResponse(BaseModel):
    result: str
    tokens_charged: int
    new_balance: int


@router.post("/editor", response_model=EditResponse)
def editor_endpoint(
    payload: EditRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.token_balance < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Недостаточно токенов. Пополните баланс, чтобы использовать ИИ-редактор.",
        )

    current_user.token_balance -= 1
    db.commit()
    db.refresh(current_user)

    try:
        result = edit_text(payload.text, payload.operation)
    except Exception as e:
        # откатываем токен, если LLM упала
        current_user.token_balance += 1
        db.add(current_user)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Ошибка LLM: {e}")

    return EditResponse(
        result=result,
        tokens_charged=1,
        new_balance=current_user.token_balance,
    )

