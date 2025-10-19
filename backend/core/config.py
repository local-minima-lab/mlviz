from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    app_name: str = "MLviz"
    debug: bool = True
    version: str = "1.0.0"

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Server config
    host: str = "0.0.0.0"
    port: int = 8000

    # Model cache config
    cache_enabled: bool = True
    cache_max_size: int = 100

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
