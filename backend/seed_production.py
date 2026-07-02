"""
Seed de producción — The Costa Rica Collection (CWL)
Proveedores + Servicios 2026 con precios multi-canal
Ejecutar desde la carpeta /app/backend en Railway
"""
import os
import sys
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# ── Importar modelos del proyecto ──────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from models import Base, User, Provider, Service, ProviderType, ServiceType

# ── Conexión a la base de datos ────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL:
    print("❌  Variable DATABASE_URL no encontrada.")
    sys.exit(1)

# Railway usa postgres://, SQLAlchemy necesita postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

print("🚀  Iniciando seed de producción...")

# ══════════════════════════════════════════════════════════════════════════════
# 1. PROVEEDORES (de Proveedores_de_Servicios_CWL.xlsx)
# ══════════════════════════════════════════════════════════════════════════════
providers_data = [
    # Transporte Terrestre
    {"name": "Franklin Araya Hernandez",                        "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "Detoxigen SRL",                                   "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "Mario Bonilla Mena",                              "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "3-102-805532 SRL",                                "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "3-102-904147 SRL",                                "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "Bionestly Natural SRL (Biosfera)",                "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    # Transporte Acuático
    {"name": "Lagunas del Corcovado SRL",                       "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "Elizabeth Montiel Mora",                          "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "Innoceana Intern",                                "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    # Transporte Aéreo
    {"name": "Central American Air Charters SA",                "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    {"name": "Servicios Aereos Nacionales SA",                  "type": ProviderType.TRANSPORT, "phone": None, "email": None},
    # Transporte / Tour
    {"name": "Luis Alexis Garcia Martinez",                     "type": ProviderType.TOUR,      "phone": None, "email": None},
    # Tours / Aventura
    {"name": "Sapoa Adventures SA",                             "type": ProviderType.TOUR,      "phone": None, "email": None},
    {"name": "ATV La Cumbre Sociedad Anonima",                  "type": ProviderType.TOUR,      "phone": None, "email": None},
    # Carga / Logística
    {"name": "Gruas SH SRL",                                    "type": ProviderType.OTHER,     "phone": None, "email": None},
    {"name": "Bluetech",                                        "type": ProviderType.OTHER,     "phone": None, "email": None},
    # Hotel propio (para tours internos)
    {"name": "Corcovado Wilderness Lodge (Propio)",             "type": ProviderType.TOUR,      "phone": None, "email": None},
]

for p in providers_data:
    existing = db.query(Provider).filter(Provider.name == p["name"]).first()
    if not existing:
        provider = Provider(
            name=p["name"],
            provider_type=p["type"],
            contact_phone=p["phone"],
            contact_email=p["email"],
            is_active=True,
        )
        db.add(provider)
        print(f"  ✅  Proveedor: {p['name']}")
    else:
        print(f"  ⏭️   Proveedor ya existe: {p['name']}")

db.commit()

# ══════════════════════════════════════════════════════════════════════════════
# 3. SERVICIOS 2026 (de SERVICIOS_2026.xlsx — hoja "Data Base")
# Columnas: pricing_code, service_name, category, service_type,
#           price_agency_shared, price_agency_private,
#           price_direct_shared, price_direct_private, price_web
# ══════════════════════════════════════════════════════════════════════════════

def d(val):
    """Convierte a Decimal o None si está vacío."""
    if val is None or val == "" or val == 0:
        return None
    try:
        return Decimal(str(val))
    except Exception:
        return None

services_data = [
    # ── TOURS ────────────────────────────────────────────────────────────────
    {"code": "TE-0001", "name": "Corcovado National Park Nature Walk",              "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 125,  "agp": 180,  "ds": 168,   "dp": None, "web": 168},
    {"code": "TE-0002", "name": "Cano Island Snorkeling Tour",                      "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 145,  "agp": 250,  "ds": 174,   "dp": None, "web": 174},
    {"code": "TE-0003", "name": "Cano Island Diving Tour",                          "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 250,  "agp": 375,  "ds": 300,   "dp": None, "web": None},
    {"code": "TE-0004", "name": "Discovery Scuba Diving",                           "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 300,  "agp": 400,  "ds": 360,   "dp": None, "web": None},
    {"code": "TE-0005", "name": "Nature Night Walk",                                "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 60,   "agp": 100,  "ds": 72,    "dp": None, "web": 72},
    {"code": "TE-0006", "name": "Tree Net Experience",                              "cat": "TOURS",     "type": ServiceType.ACTIVITY,  "ags": 100,  "agp": 150,  "ds": 120,   "dp": None, "web": 120},
    {"code": "TE-0007", "name": "Climbing Wall",                                    "cat": "TOURS",     "type": ServiceType.ACTIVITY,  "ags": 50,   "agp": 80,   "ds": 60,    "dp": None, "web": 60},
    {"code": "TE-0008", "name": "Half Day of Adventure",                            "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 130,  "agp": 156,  "ds": 156,   "dp": None, "web": 156},
    {"code": "TE-0009", "name": "Early Birding Tour",                               "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 60,   "agp": 100,  "ds": 72,    "dp": None, "web": None},
    {"code": "TE-0010", "name": "San Josecito Kayaking Tour",                       "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 140,  "agp": 200,  "ds": 168,   "dp": None, "web": None},
    {"code": "TE-0011", "name": "Horseback Riding",                                 "cat": "TOURS",     "type": ServiceType.ACTIVITY,  "ags": 120,  "agp": 180,  "ds": 144,   "dp": None, "web": None},
    {"code": "TE-0012", "name": "Corcovado National Park Nature Walk (Sirena Station)", "cat": "TOURS", "type": ServiceType.TOUR,      "ags": 380,  "agp": 475,  "ds": 456,   "dp": 512,  "web": None},
    {"code": "TE-0013", "name": "Sierpe Mangrove Tour",                             "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 150,  "agp": 225,  "ds": 180,   "dp": None, "web": None},
    {"code": "TE-0014", "name": "Sport Fishing Half Day (Private Only)",             "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": None, "agp": 700,  "ds": None,  "dp": 840,  "web": None},
    {"code": "TE-0015", "name": "Sport Fishing Full Day (Private Only)",             "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": None, "agp": 1100, "ds": None,  "dp": 1320, "web": None},
    {"code": "TE-0016", "name": "Whale & Dolphins Monitoring Experience",            "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 120,  "agp": 220,  "ds": 144,   "dp": None, "web": 145},
    {"code": "TE-0017", "name": "Claro del Bosque Expedition",                      "cat": "TOURS",     "type": ServiceType.TOUR,      "ags": 50,   "agp": 80,   "ds": 60,    "dp": None, "web": 60},
    # ── OTHERS ───────────────────────────────────────────────────────────────
    {"code": "TO-0001", "name": "Guia Adicional Groups",                            "cat": "OTHERS",    "type": ServiceType.OTHER,     "ags": None, "agp": None, "ds": None,  "dp": None, "web": None},
    {"code": "TO-0002", "name": "Romantic Package",                                 "cat": "OTHERS",    "type": ServiceType.OTHER,     "ags": None, "agp": None, "ds": None,  "dp": None, "web": 240},
    {"code": "TO-0003", "name": "Lunch and Dinner",                                 "cat": "OTHERS",    "type": ServiceType.OTHER,     "ags": None, "agp": None, "ds": None,  "dp": None, "web": 126},
    # ── SPA ──────────────────────────────────────────────────────────────────
    {"code": "SP-0001", "name": "Del Chef Experience",                              "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": None, "agp": None, "ds": 300,   "dp": None, "web": None},
    {"code": "SP-0002", "name": "Deep Connection",                                  "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 120,  "agp": None, "ds": 120,   "dp": None, "web": None},
    {"code": "SP-0003", "name": "Pachamama Touch",                                  "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 90,   "agp": None, "ds": 90,    "dp": None, "web": None},
    {"code": "SP-0004", "name": "Fresh Soul",                                       "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 120,  "agp": None, "ds": 120,   "dp": None, "web": None},
    {"code": "SP-0005", "name": "Flora Experience",                                 "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 90,   "agp": None, "ds": 90,    "dp": None, "web": None},
    {"code": "SP-0006", "name": "Ocean Breeze",                                     "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 90,   "agp": None, "ds": 90,    "dp": None, "web": None},
    {"code": "SP-0007", "name": "Rainforest Delight",                               "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 90,   "agp": None, "ds": 90,    "dp": None, "web": 99},
    {"code": "SP-0008", "name": "Jungle Bliss",                                     "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 70,   "agp": None, "ds": 70,    "dp": None, "web": None},
    {"code": "SP-0009", "name": "Soul and Body",                                    "cat": "SPA",       "type": ServiceType.ACTIVITY,  "ags": 70,   "agp": None, "ds": 70,    "dp": None, "web": None},
    # ── TRANSFERS ────────────────────────────────────────────────────────────
    {"code": "TT-0001", "name": "From Sierpe to ATO SJO (up to 4 people)",          "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 391.5, "dp": None, "web": None},
    {"code": "TT-0002", "name": "From Sierpe to Uvita (up to 4 people)",            "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 113.1, "dp": None, "web": None},
    {"code": "TT-0003", "name": "From Sierpe to Dominical (up to 4 people)",        "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 174,   "dp": None, "web": None},
    {"code": "TT-0004", "name": "From Sierpe to San Gerardo de Dota (up to 4 people)", "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 348, "dp": None, "web": None},
    {"code": "TT-0005", "name": "From Drake to Pto Jimenez",                        "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 217.5, "dp": None, "web": None},
    {"code": "TT-0006", "name": "From Sierpe to Manuel Antonio / Quepos (up to 4 people)", "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 226.2, "dp": None, "web": None},
    {"code": "TT-0007", "name": "From ATO SJO to Ojochal",                          "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 291.45, "dp": None, "web": None},
    {"code": "TT-0008", "name": "From Sierpe to ATO Liberia",                       "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 513.3, "dp": None, "web": None},
    {"code": "TT-0009", "name": "From Sierpe to SJO",                               "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 417.6, "dp": None, "web": None},
    {"code": "TT-0010", "name": "From Sierpe to Nauyaca",                           "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 174,   "dp": None, "web": None},
    {"code": "TT-0011", "name": "From Sierpe to Alta Gracia (Interamericana Sur)",  "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 226.2, "dp": None, "web": None},
    {"code": "TT-0012", "name": "From Sierpe to Alta Gracia (Costanera Sur)",       "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 287.1, "dp": None, "web": None},
    {"code": "TT-0013", "name": "From Sierpe to Puerto Jimenez",                    "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 226.2, "dp": None, "web": None},
    {"code": "TT-0014", "name": "From Sierpe to Golfito",                           "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 174,   "dp": None, "web": None},
    {"code": "TT-0015", "name": "From Sierpe to Canoas",                            "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 226.2, "dp": None, "web": None},
    {"code": "TT-0016", "name": "From Sierpe to Escazu",                            "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 408.9, "dp": None, "web": None},
    {"code": "TT-0017", "name": "From Sierpe to ATO Quepos",                        "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 226.2, "dp": None, "web": None},
    {"code": "TT-0018", "name": "From Sierpe to Jaco",                              "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 261,   "dp": None, "web": None},
    {"code": "TT-0019", "name": "From Sierpe to Monteverde",                        "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 513.3, "dp": None, "web": None},
    {"code": "TT-0020", "name": "From Sierpe to La Fortuna",                        "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 574.2, "dp": None, "web": None},
    {"code": "TT-0021", "name": "From Sierpe to Ojochal",                           "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 100.05, "dp": None, "web": None},
    {"code": "TT-0022", "name": "From ATO SJO to Bahia Drake",                      "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 609,   "dp": None, "web": None},
    {"code": "TT-0023", "name": "From Bahia Drake to ATO Drake (per person)",        "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 34.8,  "dp": None, "web": None},
    {"code": "TT-0024", "name": "From Bahia Drake to ATO Golfito",                  "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 280,   "dp": None, "web": None},
    {"code": "TT-0025", "name": "From CWL to Bahia Drake by Boat",                  "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 143.55, "dp": None, "web": None},
    {"code": "TT-0026", "name": "From CWL to Copa de Arbol by Boat",                "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 121.8, "dp": None, "web": None},
    {"code": "TT-0027", "name": "From CWL to Aguila de Osa by Boat",                "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 143.55, "dp": None, "web": None},
    {"code": "TT-0028", "name": "From CWL to Sierpe by Boat (Private)",             "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 543.75, "dp": None, "web": None},
    {"code": "TT-0029", "name": "From CWL to Uvita by Boat",                        "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": 574.2, "dp": None, "web": None},
    {"code": "TT-0030", "name": "From CWL to Bahia Drake ATO",                      "cat": "TRANSFERS", "type": ServiceType.TRANSPORT, "ags": None, "agp": None, "ds": None,  "dp": None, "web": 150},
]

for s in services_data:
    existing = db.query(Service).filter(Service.pricing_code == s["code"]).first()
    prices = [p for p in [s["ags"], s["agp"], s["ds"], s["dp"], s["web"]] if p is not None]
    base = min(prices) if prices else None

    if not existing:
        service = Service(
            pricing_code=s["code"],
            service_name=s["name"],
            category=s["cat"],
            service_type=s["type"],
            year=2026,
            currency="USD",
            price_agency_shared=d(s["ags"]),
            price_agency_private=d(s["agp"]),
            price_direct_shared=d(s["ds"]),
            price_direct_private=d(s["dp"]),
            price_web=d(s["web"]),
            base_price=d(base),
            is_active=True,
        )
        db.add(service)
        print(f"  ✅  Servicio: [{s['code']}] {s['name']}")
    else:
        print(f"  ⏭️   Servicio ya existe: [{s['code']}] {s['name']}")

db.commit()
db.close()

print("\n🎉  Seed completado exitosamente.")
print(f"   • {len(users_data)} usuarios")
print(f"   • {len(providers_data)} proveedores")
print(f"   • {len(services_data)} servicios")
