from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import bcrypt

import crud
import schemas
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEFAULT_USER_EMAIL = "admin@thecrc.com"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def get_current_user(db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, DEFAULT_USER_EMAIL)
    if not user:
        raise HTTPException(status_code=500, detail="Usuario por defecto no configurado")
    return user


def require_role(*roles: str):
    def checker(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker


@router.post("/register", response_model=schemas.UserOut)
def register(
    data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    if crud.get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Nombre de usuario ya existe")
    if not data.email:
        data.email = f"{data.username}@vouchers.internal"
    if crud.get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email ya registrado")
    return crud.create_user(db, data, hash_password(data.password))


@router.get("/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    return crud.get_all_users(db)


@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    if user_id == current_user.user_id and data.is_active is False:
        raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
    updates = data.model_dump(exclude_none=True)
    if "username" in updates:
        updates["username"] = updates["username"].lower()
    if "password" in updates:
        updates["hashed_password"] = hash_password(updates.pop("password"))
    user = crud.update_user(db, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.get("/me", response_model=schemas.UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user
