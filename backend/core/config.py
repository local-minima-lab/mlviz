from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "MLviz"
    debug: bool = True
    version: str = "1.0.0"

    # CORS - can be overridden via ALLOWED_ORIGINS env var
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    # Frontend URL for production (set via FRONTEND_URL env var in Cloud Run)
    frontend_url: str | None = None

    # Server config
    host: str = "0.0.0.0"
    port: int = 8000

    # Model cache config
    cache_enabled: bool = True
    cache_max_size: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

    def get_all_origins(self) -> List[str]:
        """Get all allowed origins including frontend_url if set."""
        origins = self.allowed_origins.copy()
        if self.frontend_url:
            origins.append(self.frontend_url)
        return origins


settings = Settings()
