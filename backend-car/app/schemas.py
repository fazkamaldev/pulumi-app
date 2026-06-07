from pydantic import BaseModel


class CarCreate(BaseModel):
    name: str
    brand_id: int


class CarRead(BaseModel):
    id: int
    name: str
    brand_id: int
    model_config = {"from_attributes": True}
