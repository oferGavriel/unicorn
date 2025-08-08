from app.core.config import get_settings

settings = get_settings()
print("ASYNC URL:", settings.db_url_async)
