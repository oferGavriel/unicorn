import os

from pydantic import Field, PostgresDsn
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: PostgresDsn = Field(
        default=PostgresDsn("postgresql://postgres:3578@localhost:5432/unicorn"),
        alias="DATABASE_URL",
    )

    secret_key: str
    algorithm: str = "HS256"
    access_token_exp_minutes: int = 1500
    refresh_token_exp_days: int = 30

    max_tries: int = 60
    wait_seconds: int = 1

    cloudinary_cloud_name: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    cloudinary_folder: str = os.getenv("CLOUDINARY_FOLDER", "avatars")
    cloudinary_base: str = os.getenv("CLOUDINARY_BASE", "blank.png")

    @property
    def db_url_sync(self) -> str:
        return str(self.database_url)

    @property
    def db_url_async(self) -> str:
        return str(self.database_url).replace("postgresql://", "postgresql+asyncpg://")

    model_config = SettingsConfigDict(
        env_file=".env",
        populate_by_name=True,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
