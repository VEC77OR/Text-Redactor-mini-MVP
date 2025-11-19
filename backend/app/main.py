from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.db import Base, engine
from app import models, auth
from app.routers import editor, billing, admin

# Инициализация базы данных
# SQLAlchemy сам берёт описания моделей из app.models -> Base
Base.metadata.create_all(bind=engine)

# Создание приложения FastAPI
app = FastAPI(title="Mini AI Text Editor")

# CORS (Cross-Origin Resource Sharing)
# Позволяет фронту отправлять запросы к API.
# Здесь открыты все origins, так как проект локальный.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROOT_DIR — корень проекта (на 2 уровня выше текущего файла)
ROOT_DIR = Path(__file__).resolve().parents[2]
# Папка, где лежит frontend
FRONTEND_DIR = ROOT_DIR / "frontend"

# Подключение статических файлов
# Всё, что лежит в frontend/, доступно по /static/...
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


# Главная страница (index.html)
@app.get("/")
def serve_index():
  return FileResponse(FRONTEND_DIR / "index.html")


# Страница админ-панели (admin.html)
@app.get("/admin")
def serve_admin():
    return FileResponse(FRONTEND_DIR / "admin.html")


# Подключение роутеров API
app.include_router(auth.router, prefix="/api/auth", tags=["auth"]) # Авторизация, регистрация, токены
app.include_router(editor.router, prefix="/api", tags=["editor"]) # ИИ-редактор текста
app.include_router(billing.router, prefix="/api/billing", tags=["billing"]) # Пополнение баланса / транзакции
app.include_router(admin.router, prefix="/api/admin", tags=["admin"]) # Админ-панель
