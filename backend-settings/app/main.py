from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from .models import Setting
from .schemas import SettingCreate, SettingRead

app = FastAPI(title="Settings API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok", "service": "settings"}


@app.get("/settings", response_model=list[SettingRead])
def list_settings(db: Session = Depends(get_db)):
    return db.query(Setting).order_by(Setting.name).all()


@app.post("/settings", response_model=SettingRead)
def create_setting(payload: SettingCreate, db: Session = Depends(get_db)):
    setting = Setting(name=payload.name.strip())
    db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting
