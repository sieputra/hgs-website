from pydantic import BaseModel, ConfigDict


class PublicService(BaseModel):
    code: str
    title: str
    summary: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class FAQ(BaseModel):
    code: str
    question: str
    answer: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)
