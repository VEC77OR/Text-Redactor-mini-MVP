from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from .db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)  # пока просто строка
    is_admin = Column(Boolean, default=False)
    token_balance = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

