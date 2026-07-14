from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    database_url: str = "postgresql://voucher_user:voucher_pass@localhost:5432/vouchers_db"
    api_url: str = "https://sistema-vouchers-backend-production.up.railway.app"
    frontend_url: str = "https://vouchers.thecostaricacollection.com"
    upload_dir: str = "uploads/voucher-photos"
    pdf_dir: str = "uploads/vouchers-pdf"
    max_file_size: int = 5242880

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.pdf_dir).mkdir(parents=True, exist_ok=True)
