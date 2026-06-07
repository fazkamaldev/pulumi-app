from pydantic import BaseModel


class SettingCreate(BaseModel):
    name: str


class SettingRead(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
