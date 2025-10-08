from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: PostgresDsn = Field(
        default=PostgresDsn("postgresql://postgres:3578@localhost:5432/unicorn"),
        alias="DATABASE_URL",
    )

    secret_key: str = Field(default="super-secret")
    algorithm: str = "HS256"
    access_token_exp_minutes: int = 1500
    refresh_token_exp_days: int = 30

    max_tries: int = 60
    wait_seconds: int = 1

    redis_url: str = Field(
        default="redis://localhost:6379/0",
        alias="REDIS_URL",
    )

    notif_window_seconds: int = Field(default=300, ge=1)
    notif_suppress_minutes: int = Field(default=5, ge=1)
    notif_worker_poll_ms: int = Field(default=5000, ge=1000)

    resend_api_key: str = Field(default="")
    from_email: str = Field(default="")
    from_name: str = Field(default="Unicorn Notifications")
    frontend_url: str = Field(default="http://localhost:5173")

    cloudinary_cloud_name: str = Field(default="")
    cloudinary_folder: str = Field(default="avatars")
    cloudinary_base: str = Field(default="blank.png")

    @property
    def db_url_sync(self) -> str:
        return str(self.database_url)

    @property
    def db_url_async(self) -> str:
        return str(self.database_url).replace("postgresql://", "postgresql+asyncpg://")

    @property
    def notif_suppress_seconds(self) -> int:
        return self.notif_suppress_minutes * 60

    model_config = SettingsConfigDict(
        env_file=".env",
        populate_by_name=True,
        extra="ignore",
    )


def get_settings() -> Settings:
    return Settings()
