from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud
import schemas
from database import get_db
from api.auth import get_current_user, require_role

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.get("/pending", response_model=List[schemas.VoucherUsageOut])
def pending_audits(db: Session = Depends(get_db), _=Depends(require_role("admin", "auditor"))):
    return crud.get_pending_audits(db)


@router.post("/{usage_id}/validate", response_model=schemas.AuditLogOut)
def validate_usage(
    usage_id: int,
    data: schemas.AuditValidate,
    db: Session = Depends(get_db),
    user=Depends(require_role("admin", "auditor")),
):
    # RN-008: findings required
    if not data.findings or not data.findings.strip():
        raise HTTPException(400, "Findings field is required (RN-008)")
    usage = crud.get_voucher_usage(db, usage_id)
    if not usage:
        raise HTTPException(404, "Voucher usage not found")
    return crud.create_audit_log(db, usage_id, data, auditor_name=user.name)


@router.get("/report", response_model=List[schemas.AuditLogOut])
def audit_report(db: Session = Depends(get_db), _=Depends(require_role("admin", "auditor"))):
    from models import AuditLog
    from sqlalchemy.orm import joinedload
    return (
        db.query(AuditLog)
        .options(joinedload(AuditLog.usage))
        .order_by(AuditLog.audit_date.desc())
        .limit(200)
        .all()
    )


@router.get("/voucher/{consecutive_number}/scans")
def voucher_scans(consecutive_number: str, db: Session = Depends(get_db), _=Depends(require_role("admin", "auditor"))):
    """Historial de escaneos QR de un voucher (quién/cuándo/desde dónde).
    Antes vivía en api/public.py bajo /api/public — quedaba expuesto sin la
    cookie SSO porque ese prefijo es público. Se movió aquí para que el
    guardia SSO lo exija."""
    from models import Voucher, VoucherScan
    v = db.query(Voucher).filter(Voucher.consecutive_number == consecutive_number).first()
    if not v:
        return []
    scans = (
        db.query(VoucherScan)
        .filter(VoucherScan.voucher_id == v.voucher_id)
        .order_by(VoucherScan.scanned_at.desc())
        .all()
    )
    return [
        {
            "scan_id":    s.scan_id,
            "scanned_at": str(s.scanned_at),
            "ip_address": s.ip_address,
            "user_agent": s.user_agent,
        }
        for s in scans
    ]
