from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, SecretStr
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..services.activity_service import log_auth_activity
from ..services.admin_auth import (
    AdminSession, COOKIE, TTL, check_origin, issue_session, require_admin, settings, verify_credentials,
)

router = APIRouter(prefix="/api/admin", tags=["Admin Authentication"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: SecretStr = Field(min_length=1, max_length=1024)


@router.post("/login", dependencies=[Depends(check_origin)])
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    try:
        verify_credentials(body.username, body.password.get_secret_value())
    except HTTPException as error:
        if error.status_code == 401:
            log_auth_activity(db, body.username, "ADMIN_LOGIN_FAILED")
        raise
    token = issue_session(db)
    log_auth_activity(db, settings()["username"], "ADMIN_LOGIN")
    response.set_cookie(COOKIE, token, max_age=TTL, httponly=True,
                        secure=settings()["secure"], samesite="lax", path="/api")
    response.headers["Cache-Control"] = "no-store"
    return {"username": settings()["username"], "expires_in": TTL}


@router.get("/me")
def me(response: Response, session=Depends(require_admin)):
    response.headers["Cache-Control"] = "no-store"
    return {"username": settings()["username"], "expires_at": session.expires_at}


@router.post("/logout")
def logout(response: Response, session=Depends(require_admin), db: Session = Depends(get_db)):
    # Only the request that actually revokes the session records a logout.
    # Commit revocation first so an audit failure cannot restore the session.
    try:
        revoked = db.query(AdminSession).filter(AdminSession.id == session.id).delete(synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(503, "Unable to log out. Please try again.") from None
    if revoked:
        log_auth_activity(db, settings()["username"], "ADMIN_LOGOUT")
    response.delete_cookie(COOKIE, path="/api", secure=settings()["secure"], httponly=True, samesite="lax")
    response.headers["Cache-Control"] = "no-store"
    return {"message": "Logged out."}
