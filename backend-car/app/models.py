from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base


class Brand(Base):
    """Read-only reference so SQLAlchemy can resolve the cars.brand_id FK."""

    __tablename__ = "brands"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)


class Car(Base):
    __tablename__ = "cars"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id"), nullable=False)
