from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    db_host: str
    db_port: int
    db_name: str
    db_user: str
    db_pass: str

    secret_key: str = "your_secret_key"
    algorithm: str = "HS256"
    access_token_exp_minutes: int = 1500
    refresh_token_exp_days: int = 30

    @property
    def db_url(self) -> str:
        return f"postgresql+psycopg2://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def db_url_async(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"

    model_config = SettingsConfigDict(
        env_file=".env",
        from_attributes=True,
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
