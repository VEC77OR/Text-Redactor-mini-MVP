from app.db import SessionLocal, Base, engine
from app import models

Base.metadata.create_all(bind=engine)

db = SessionLocal()

user = models.User(
    email="test@example.com",
    password_hash="test",  # потом заменим на хэш
    token_balance=5,
    is_admin=True,
)
db.add(user)
db.commit()
db.refresh(user)
print("Создан пользователь:", user.id, user.email, "баланс:", user.token_balance)

db.close()

