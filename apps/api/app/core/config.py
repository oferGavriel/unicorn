from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str = "db"
    db_port: int = 5432
    db_name: str = "mondaylite"
    db_user: str = "mondaylite"
    db_pass: str = "mondaylite"

    secret_key: str = "dev-secret"
    access_token_exp_minutes: int = 15
    refresh_token_exp_days: int = 14

    @property
    def db_url(self) -> str:
        return f"postgresql+psycopg2://{self.db_user}:{self.db_pass}@{self.db_host}:{self.db_port}/{self.db_name}"
    

    class Config:
        env_file = ".env"
        

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()