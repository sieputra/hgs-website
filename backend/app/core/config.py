from functools import lru_cache
from pathlib import Path
from typing import Annotated
from typing import Any

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic_settings import NoDecode


class Settings(BaseSettings):
    app_name: str = "HGS Backend"
    app_env: str = "local"
    app_debug: bool = False
    api_prefix: str = "/api"
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    database_url: str | None = None
    database_echo: bool = False
    upload_dir: str = "uploads"
    max_gallery_image_bytes: int = 8 * 1024 * 1024
    admin_auth_secret_key: str = "dev-insecure-admin-secret-change-me"
    admin_access_token_minutes: int = 60
    admin_cli_secret: str | None = None

    @property
    def upload_path(self) -> Path:
        return Path(self.upload_dir)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str] | Any:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.dev"),
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
