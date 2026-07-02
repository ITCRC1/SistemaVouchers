from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import Base, engine
from config import settings
from api import auth, providers, services, vouchers, voucher_usage, audit, reports, public

Base.metadata.create_all(bind=engine)

# Migrations — add columns introduced after initial deploy
# Each statement runs in autocommit so a failure on one doesn't abort the rest.
_sql = __import__("sqlalchemy").text
with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    for stmt in [
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS service_date DATE",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS sales_channel VARCHAR(50)",
        "ALTER TABLE vouchers ALTER COLUMN provider_id DROP NOT NULL",
        "ALTER TABLE vouchers ALTER COLUMN guest_photo_url DROP NOT NULL",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_code VARCHAR(20)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(50)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_agency_shared NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_agency_private NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_direct_shared NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_direct_private NUMERIC(10,2)",
        "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_web NUMERIC(10,2)",
        "ALTER TABLE services ALTER COLUMN provider_id DROP NOT NULL",
        "ALTER TABLE services ALTER COLUMN base_price DROP NOT NULL",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS guest_price NUMERIC(10,2)",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS audit_status VARCHAR(20) DEFAULT 'PENDIENTE'",
        """CREATE TABLE IF NOT EXISTS voucher_scans (
            scan_id SERIAL PRIMARY KEY,
            voucher_id INTEGER NOT NULL REFERENCES vouchers(voucher_id),
            scanned_at TIMESTAMP DEFAULT NOW(),
            ip_address VARCHAR(45),
            user_agent VARCHAR(300)
        )""",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(80)",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS audit_notes TEXT",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS audited_by VARCHAR(100)",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS audited_at TIMESTAMP",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS provider_confirmed BOOLEAN DEFAULT FALSE",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS provider_confirmed_at TIMESTAMP",
        "ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS provider_confirmed_ip VARCHAR(45)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50)",
        "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users(username) WHERE username IS NOT NULL",
    ]:
        try:
            conn.execute(_sql(stmt))
        except Exception as _e:
            print(f"Migration note: {_e}")

app = FastAPI(title="Sistema de Vouchers Electrónicos", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded photos and PDFs
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
Path(settings.pdf_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(providers.router)
app.include_router(services.router)
app.include_router(vouchers.router)
app.include_router(voucher_usage.router)
app.include_router(audit.router)
app.include_router(reports.router)
app.include_router(public.router)


@app.get("/")
def root():
    return {"message": "Sistema de Vouchers API", "docs": "/docs"}


@app.on_event("startup")
def seed_admin():
    import os, secrets
    from database import SessionLocal
    from crud import get_user_by_email, create_user
    from schemas import UserCreate
    from api.auth import hash_password

    db = SessionLocal()
    try:
        from crud import update_user as _upd

        # Admin
        admin = get_user_by_email(db, "admin@thecrc.com")
        if not admin:
            pwd = os.getenv("SEED_ADMIN_PASSWORD") or secrets.token_urlsafe(16)
            create_user(db, UserCreate(
                email="admin@thecrc.com", username="admin",
                name="Administrador", password=pwd, role="admin",
            ), hash_password(pwd))
            print(f"✓ Admin user created")
        else:
            updates: dict = {}
            if not admin.username:
                updates["username"] = "admin"
            env_pwd = os.getenv("SEED_ADMIN_PASSWORD")
            if env_pwd:
                updates["hashed_password"] = hash_password(env_pwd)
            if updates:
                _upd(db, admin.user_id, updates)

        # jretana
        jretana = get_user_by_email(db, "jretana@thecrc.com")
        if not jretana:
            pwd = os.getenv("SEED_JRETANA_PASSWORD") or secrets.token_urlsafe(16)
            jretana = create_user(db, UserCreate(
                email="jretana@thecrc.com", username="jretana",
                name="J. Retana", password=pwd, role="admin",
            ), hash_password(pwd))
            print("✓ User jretana created")
        else:
            updates = {}
            if not jretana.username:
                updates["username"] = "jretana"
            if jretana.role != "admin":
                updates["role"] = "admin"
            env_pwd = os.getenv("SEED_JRETANA_PASSWORD")
            if env_pwd:
                updates["hashed_password"] = hash_password(env_pwd)
            if updates:
                _upd(db, jretana.user_id, updates)
                print("✓ jretana synced")
    except Exception as e:
        print(f"Seed warning: {e}")
    finally:
        db.close()
