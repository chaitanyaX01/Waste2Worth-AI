import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Waste2Worth AI"
    API_V1_PREFIX: str = "/api"
    
    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/waste2worth"
    
    # Security & JWT
    SECRET_KEY: str = "waste2worth-production-secret-key-for-waste-management-platform-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # AI Model & Class Names
    MODEL_PATH: str = str(BASE_DIR / "waste2worth_resnet18.pth")
    CLASS_NAMES_PATH: str = str(BASE_DIR / "class_names.json")
    
    # Uploads Storage
    UPLOAD_DIR: str = str(BACKEND_DIR / "uploads")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # Twilio WhatsApp & SMS OTP Configuration
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_NUMBER: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+17372508034")
    TWILIO_SANDBOX_KEYWORD: str = os.getenv("TWILIO_SANDBOX_KEYWORD", "join twilio-trial")
    TWILIO_SANDBOX_NUMBER_DISPLAY: str = os.getenv("TWILIO_SANDBOX_NUMBER_DISPLAY", "+1 737 250 8034")
    TWILIO_VERIFY_SERVICE_SID: str = os.getenv("TWILIO_VERIFY_SERVICE_SID", "VA17bcb7880ff7f99ade25940e8096a97e")

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
