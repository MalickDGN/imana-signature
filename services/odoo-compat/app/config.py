from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Maison Imana"
    environment: str = "development"
    odoo_url: str = Field(default="https://edu-mdgnsignature.odoo.com")
    odoo_db: str = Field(default="")
    odoo_username: str = Field(default="")
    odoo_password: str = Field(default="")
    odoo_timeout: int = Field(default=20, ge=5, le=120)
    enable_odoo_sync: bool = False

    @field_validator("odoo_url")
    @classmethod
    def validate_odoo_url(cls, value: str) -> str:
        cleaned = value.strip().rstrip("/")
        if not cleaned:
            raise ValueError("odoo_url must not be empty")
        return cleaned

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
