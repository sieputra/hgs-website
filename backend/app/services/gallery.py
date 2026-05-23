from collections.abc import AsyncIterator
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from uuid import UUID
from uuid import uuid4

from fastapi import HTTPException
from fastapi import UploadFile
from fastapi import status

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


@dataclass(frozen=True)
class OptimizedGalleryUpload:
    contents: bytes
    original_filename: str | None


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
        optimized_upload = await self._read_optimized_upload(upload)
        image_id = uuid4()
        target_path = self._write_gallery_upload(
            image_id=image_id,
            contents=optimized_upload.contents,
        )

        if sort_order is None:
            sort_order = self._next_sort_order()

        clean_title = _clean_required_text(title, "title")
        clean_caption = _clean_required_text(caption, "caption")
        image = self._repository.create_image(
            id=image_id,
            title=clean_title,
            caption=clean_caption,
            image_url=f"/uploads/gallery/{target_path.name}",
            image_alt=image_alt.strip() if image_alt and image_alt.strip() else clean_title,
            original_filename=optimized_upload.original_filename,
            content_type="image/webp",
            file_size=len(optimized_upload.contents),
            sort_order=sort_order,
            is_active=is_active,
        )
        return GalleryImageAdmin.model_validate(image)

    async def update_image(
        self,
        *,
        image_id: UUID,
        upload: UploadFile | None,
        title: str | None,
        caption: str | None,
        image_alt: str | None,
        sort_order: int | None,
        is_active: bool | None,
    ) -> GalleryImageAdmin:
        image = self._repository.get_image(image_id)
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gallery image was not found.",
            )

        image_url: str | None = None
        original_filename: str | None = None
        file_size: int | None = None
        if upload is not None:
            optimized_upload = await self._read_optimized_upload(upload)
            self._delete_uploaded_file(image.image_url)
            target_path = self._write_gallery_upload(
                image_id=image_id,
                contents=optimized_upload.contents,
            )
            image_url = f"/uploads/gallery/{target_path.name}"
            original_filename = optimized_upload.original_filename
            file_size = len(optimized_upload.contents)

        clean_title = _clean_required_text(title, "title") if title is not None else None
        clean_caption = (
            _clean_required_text(caption, "caption") if caption is not None else None
        )
        clean_image_alt = image_alt.strip() if image_alt is not None else None
        if clean_image_alt == "":
            clean_image_alt = clean_title or image.title

        updated_image = self._repository.update_image(
            image,
            title=clean_title,
            caption=clean_caption,
            image_alt=clean_image_alt,
            image_url=image_url,
            original_filename=original_filename,
            content_type="image/webp" if upload is not None else None,
            file_size=file_size,
            sort_order=sort_order,
            is_active=is_active,
        )
        return GalleryImageAdmin.model_validate(updated_image)

    def delete_image(self, *, image_id: UUID) -> None:
        image = self._repository.get_image(image_id)
        if image is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gallery image was not found.",
            )
        self._delete_uploaded_file(image.image_url)
        self._repository.delete_image(image)

    async def _read_optimized_upload(self, upload: UploadFile) -> OptimizedGalleryUpload:
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

        return OptimizedGalleryUpload(
            contents=self._optimize_image(contents),
            original_filename=Path(upload.filename or "").name or None,
        )

    def _write_gallery_upload(self, *, image_id: UUID, contents: bytes) -> Path:
        upload_root = settings.upload_path / "gallery"
        upload_root.mkdir(parents=True, exist_ok=True)
        target_path = upload_root / f"{image_id}.webp"
        target_path.write_bytes(contents)
        return target_path

    def _delete_uploaded_file(self, image_url: str) -> None:
        upload_prefix = "/uploads/"
        if not image_url.startswith(upload_prefix):
            return
        relative_path = Path(image_url.removeprefix(upload_prefix))
        if relative_path.is_absolute() or ".." in relative_path.parts:
            return
        target_path = settings.upload_path / relative_path
        if target_path.exists() and target_path.is_file():
            target_path.unlink()

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


def _clean_required_text(value: str, field_name: str) -> str:
    cleaned_value = value.strip()
    if not cleaned_value:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{field_name} is required.",
        )
    return cleaned_value


async def get_gallery_service() -> AsyncIterator[GalleryService]:
    if not settings.database_url:
        yield GalleryService(GalleryRepository())
        return

    session_factory = get_session_factory()
    with session_factory() as session:
        yield GalleryService(DatabaseGalleryRepository(session))
