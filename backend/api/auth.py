from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional

import crud
import schemas
from database import get_db
from config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    exc = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if not email:
            raise exc
    except JWTError:
        raise exc
    user = crud.get_user_by_email(db, email)
    if not user or not user.is_active:
        raise exc
    return user


def require_role(*roles: str):
    def checker(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker


@router.post("/login", response_model=schemas.Token)
def login(form: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_identifier(db, form.email)
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Cuenta desactivada")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


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
    if "password" in updates:
        updates["hashed_password"] = hash_password(updates.pop("password"))
    user = crud.update_user(db, user_id, updates)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user



@router.get("/me", response_model=schemas.UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user
