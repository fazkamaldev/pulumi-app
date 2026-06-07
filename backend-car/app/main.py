from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from .models import Car
from .schemas import CarCreate, CarRead

app = FastAPI(title="Car API")

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
    return {"status": "ok", "service": "car"}


@app.get("/cars", response_model=list[CarRead])
def list_cars(db: Session = Depends(get_db)):
    return db.query(Car).order_by(Car.name).all()


@app.post("/cars", response_model=CarRead)
def create_car(payload: CarCreate, db: Session = Depends(get_db)):
    brand = db.execute(
        text("SELECT id FROM brands WHERE id = :id"),
        {"id": payload.brand_id},
    ).first()
    if brand is None:
        raise HTTPException(status_code=404, detail="Brand not found")

    car = Car(name=payload.name.strip(), brand_id=payload.brand_id)
    db.add(car)
    db.commit()
    db.refresh(car)
    return car
