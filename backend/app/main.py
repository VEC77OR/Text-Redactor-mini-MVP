from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.db import Base, engine
from app import models, auth
from app.routers import editor, billing

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini AI Text Editor")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = ROOT_DIR / "frontend"

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

@app.get("/")
def serve_index():
  return FileResponse(FRONTEND_DIR / "index.html")


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(editor.router, prefix="/api", tags=["editor"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
