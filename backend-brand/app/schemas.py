from pydantic import BaseModel


class BrandCreate(BaseModel):
    name: str


class BrandRead(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
