from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from .models import Brand
from .schemas import BrandCreate, BrandRead

app = FastAPI(title="Brand API")

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
    return {"status": "ok", "service": "brand"}


@app.get("/brands", response_model=list[BrandRead])
def list_brands(db: Session = Depends(get_db)):
    return db.query(Brand).order_by(Brand.name).all()


@app.post("/brands", response_model=BrandRead)
def create_brand(payload: BrandCreate, db: Session = Depends(get_db)):
    brand = Brand(name=payload.name.strip())
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand
