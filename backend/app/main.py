from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import Base, engine, get_db
from .models import Item
from .schemas import ItemCreate, ItemRead

app = FastAPI(title="App API")

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
    return {"status": "ok"}

@app.get("/items", response_model=list[ItemRead])
def list_items(db: Session = Depends(get_db)):
    return db.query(Item).all()

@app.post("/items", response_model=ItemRead)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    item = Item(name=payload.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item