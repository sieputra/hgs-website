from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import ConfigDict


class GalleryImage(BaseModel):
    id: UUID
    title: str
    caption: str
    image_url: str
    image_alt: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class GalleryImageAdmin(GalleryImage):
    original_filename: str | None = None
    content_type: str | None = None
    file_size: int | None = None
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
