from dataclasses import dataclass
from datetime import UTC
from datetime import datetime
from uuid import UUID

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import GalleryImageModel


@dataclass(frozen=True)
class GalleryImageRecord:
    id: UUID
    title: str
    caption: str
    image_url: str
    image_alt: str
    sort_order: int
    is_active: bool = True
    original_filename: str | None = None
    content_type: str | None = None
    file_size: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class GalleryRepository:
    _uploaded_images: list[GalleryImageRecord] = []
    _seed_images = (
        GalleryImageRecord(
            id=UUID("8a93a98c-f3bb-4928-87ee-59dc5f5d7401"),
            title="Operations",
            caption="Daily logistics activity around HGS fleet and distribution teams.",
            image_url="/images/gallery/rio7985-2.webp",
            image_alt="HGS team member checking a truck during operations",
            sort_order=1,
        ),
        GalleryImageRecord(
            id=UUID("3506545f-4a17-4c31-8010-887f83c1d6c2"),
            title="Colleagues",
            caption="Most of our time, perhaps is spent with you.",
            image_url="/images/gallery/dsc0632-1-1.webp",
            image_alt="HGS colleagues gathered outdoors",
            sort_order=2,
        ),
        GalleryImageRecord(
            id=UUID("cf4de750-9d34-44c5-81e3-ff86c1b46fe7"),
            title="Office",
            caption="Coordination and administration keep each delivery route moving.",
            image_url="/images/gallery/img-20171111-wa0007.webp",
            image_alt="HGS office team working at computers",
            sort_order=3,
        ),
        GalleryImageRecord(
            id=UUID("e5b891b7-8a32-4b13-9b46-dad9b5f11a04"),
            title="Fleet Yard",
            caption="Preparation starts before the first mile leaves the yard.",
            image_url="/images/gallery/dsc0651-1-1.webp",
            image_alt="HGS staff observing parked trucks in a yard",
            sort_order=4,
        ),
        GalleryImageRecord(
            id=UUID("cb802d0b-8bb6-4fd9-b72b-ad025b1f9254"),
            title="Distribution",
            caption="Goods move through HGS routes with practical field support.",
            image_url="/images/gallery/truck23.webp",
            image_alt="HGS green distribution truck on the road",
            sort_order=5,
        ),
        GalleryImageRecord(
            id=UUID("996b877c-481c-46a7-a508-e3bd711a1431"),
            title="Warehouse",
            caption="Fleet and warehouse teams work together from loading to dispatch.",
            image_url="/images/gallery/truck.webp",
            image_alt="HGS truck parked near a warehouse loading area",
            sort_order=6,
        ),
    )

    def list_public_images(self) -> list[GalleryImageRecord]:
        return sorted(
            (
                image
                for image in (*self._seed_images, *self._uploaded_images)
                if image.is_active
            ),
            key=lambda image: image.sort_order,
        )

    def list_admin_images(self) -> list[GalleryImageRecord]:
        return sorted(
            [*self._seed_images, *self._uploaded_images],
            key=lambda image: image.sort_order,
        )

    def create_image(
        self,
        *,
        id: UUID,
        title: str,
        caption: str,
        image_url: str,
        image_alt: str,
        original_filename: str | None,
        content_type: str | None,
        file_size: int,
        sort_order: int,
        is_active: bool,
    ) -> GalleryImageRecord:
        now = datetime.now(UTC)
        image = GalleryImageRecord(
            id=id,
            title=title,
            caption=caption,
            image_url=image_url,
            image_alt=image_alt,
            original_filename=original_filename,
            content_type=content_type,
            file_size=file_size,
            sort_order=sort_order,
            is_active=is_active,
            created_at=now,
            updated_at=now,
        )
        self._uploaded_images.append(image)
        return image


class DatabaseGalleryRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_public_images(self) -> list[GalleryImageModel]:
        return list(
            self._session.scalars(
                select(GalleryImageModel)
                .where(GalleryImageModel.is_active.is_(True))
                .order_by(GalleryImageModel.sort_order, GalleryImageModel.created_at)
            )
        )

    def list_admin_images(self) -> list[GalleryImageModel]:
        return list(
            self._session.scalars(
                select(GalleryImageModel).order_by(
                    GalleryImageModel.sort_order,
                    GalleryImageModel.created_at,
                )
            )
        )

    def next_sort_order(self) -> int:
        current = self._session.scalar(select(func.max(GalleryImageModel.sort_order)))
        return int(current or 0) + 1

    def create_image(
        self,
        *,
        id: UUID,
        title: str,
        caption: str,
        image_url: str,
        image_alt: str,
        original_filename: str | None,
        content_type: str | None,
        file_size: int,
        sort_order: int,
        is_active: bool,
    ) -> GalleryImageModel:
        image = GalleryImageModel(
            id=id,
            title=title,
            caption=caption,
            image_url=image_url,
            image_alt=image_alt,
            original_filename=original_filename,
            content_type=content_type,
            file_size=file_size,
            sort_order=sort_order,
            is_active=is_active,
        )
        self._session.add(image)
        self._session.commit()
        self._session.refresh(image)
        return image
