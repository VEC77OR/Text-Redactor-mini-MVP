from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)  # пока просто строка
    is_admin = Column(Boolean, default=False)
    token_balance = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="transactions")
    amount_currency = Column(Float, nullable=False)   # введённая сумма в валюте
    tokens = Column(Integer, nullable=False)          # сколько токенов начислили
    currency = Column(String, default="TEST")         # пока просто тестовая валюта
    status = Column(String, default="success")        # "success" / "failed" и т.п.
    created_at = Column(DateTime, default=datetime.utcnow)


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String, default="TEST")
    token_rate = Column(Float, default=1.0)  # 1 токен = X валюты
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
