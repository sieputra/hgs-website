from collections.abc import AsyncIterator
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException
from fastapi import UploadFile

from app.core.config import settings
from app.db.session import get_session_factory
from app.repositories.gallery import DatabaseGalleryRepository
from app.repositories.gallery import GalleryRepository
from app.schemas.gallery import GalleryImage
from app.schemas.gallery import GalleryImageAdmin


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}
GALLERY_IMAGE_SIZE = (1920, 1280)
GALLERY_IMAGE_QUALITY = 82


class GalleryService:
    def __init__(
        self,
        repository: GalleryRepository | DatabaseGalleryRepository,
    ) -> None:
        self._repository = repository

    def list_public_images(self) -> list[GalleryImage]:
        return [
            GalleryImage.model_validate(image)
            for image in self._repository.list_public_images()
        ]

    def list_admin_images(self) -> list[GalleryImageAdmin]:
        return [
            GalleryImageAdmin.model_validate(image)
            for image in self._repository.list_admin_images()
        ]

    async def create_image_from_upload(
        self,
        *,
        upload: UploadFile,
        title: str,
        caption: str,
        image_alt: str | None,
        sort_order: int | None,
        is_active: bool,
    ) -> GalleryImageAdmin:
        if upload.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Gallery image must be JPEG, PNG, WebP, or GIF.",
            )

        contents = await upload.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Gallery image is required.")
        if len(contents) > settings.max_gallery_image_bytes:
            raise HTTPException(status_code=413, detail="Gallery image is too large.")

        optimized_contents = self._optimize_image(contents)
        image_id = uuid4()
        upload_root = settings.upload_path / "gallery"
        upload_root.mkdir(parents=True, exist_ok=True)
        target_path = upload_root / f"{image_id}.webp"
        target_path.write_bytes(optimized_contents)

        if sort_order is None:
            sort_order = self._next_sort_order()

        clean_title = title.strip()
        clean_caption = caption.strip()
        image = self._repository.create_image(
            id=image_id,
            title=clean_title,
            caption=clean_caption,
            image_url=f"/uploads/gallery/{target_path.name}",
            image_alt=(image_alt or clean_title).strip(),
            original_filename=Path(upload.filename or "").name or None,
            content_type="image/webp",
            file_size=len(optimized_contents),
            sort_order=sort_order,
            is_active=is_active,
        )
        return GalleryImageAdmin.model_validate(image)

    def _optimize_image(self, contents: bytes) -> bytes:
        try:
            from PIL import Image
            from PIL import ImageOps
            from PIL import UnidentifiedImageError
        except ImportError as exc:
            raise HTTPException(
                status_code=500,
                detail="Image optimization dependency is not installed.",
            ) from exc

        try:
            with Image.open(BytesIO(contents)) as source:
                image = ImageOps.exif_transpose(source)
                image.thumbnail(GALLERY_IMAGE_SIZE, Image.Resampling.LANCZOS)
                has_alpha = image.mode in {"RGBA", "LA"} or (
                    image.mode == "P" and "transparency" in image.info
                )
                image = image.convert("RGBA" if has_alpha else "RGB")
                output = BytesIO()
                image.save(
                    output,
                    format="WEBP",
                    method=6,
                    optimize=True,
                    quality=GALLERY_IMAGE_QUALITY,
                )
                return output.getvalue()
        except UnidentifiedImageError as exc:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is not a valid image.",
            ) from exc

    def _next_sort_order(self) -> int:
        if isinstance(self._repository, DatabaseGalleryRepository):
            return self._repository.next_sort_order()

        admin_images = self._repository.list_admin_images()
        if not admin_images:
            return 1
        return max(image.sort_order for image in admin_images) + 1


async def get_gallery_service() -> AsyncIterator[GalleryService]:
    if not settings.database_url:
        yield GalleryService(GalleryRepository())
        return

    session_factory = get_session_factory()
    with session_factory() as session:
        yield GalleryService(DatabaseGalleryRepository(session))
