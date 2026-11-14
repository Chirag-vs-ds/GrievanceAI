"""Single-admin authentication. JWTs require a live, revocable DB session."""
import hashlib
import os
import secrets
import threading
import time
from functools import lru_cache
from pathlib import Path

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, InvalidHashError
from dotenv import dotenv_values
from fastapi import Depends, HTTPException, Request
from sqlalchemy import Column, String, BigInteger
from sqlalchemy.orm import Session

from ..database.connection import Base, get_db

COOKIE = "grievanceai_admin"
TTL = 1800
hasher = PasswordHasher()


class AdminSession(Base):
    __tablename__ = "admin_sessions"
    id = Column(String(64), primary_key=True)
    expires_at = Column(BigInteger, nullable=False)


@lru_cache
def settings():
    config = {**dotenv_values(Path(__file__).resolve().parents[2] / ".env"), **os.environ}
    username = config.get("ADMIN_USERNAME", "")
    password_hash = config.get("ADMIN_PASSWORD_HASH", "")
    secret = config.get("ADMIN_JWT_SECRET", "")
    if not username or not password_hash.startswith("$argon2id$") or len(secret) < 43:
        raise HTTPException(503, "Admin authentication is not configured.")
    return {
        "username": username, "hash": password_hash, "secret": secret,
        "secure": config.get("ADMIN_COOKIE_SECURE", "true").lower() == "true",
        "origins": config.get("ADMIN_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    }


def check_origin(request: Request):
    # Required even for login/logout to prevent login CSRF and cross-site mutations.
    if request.headers.get("origin") not in settings()["origins"]:
        raise HTTPException(403, "Untrusted request origin.")


def session_id(token_id: str):
    return hashlib.sha256(token_id.encode()).hexdigest()


def require_admin(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(401, "Admin login required.")
    config = settings()
    try:
        claims = jwt.decode(token, config["secret"], algorithms=["HS256"],
                            issuer="grievanceai", audience="grievanceai-admin",
                            options={"require": ["exp", "iat", "sub", "jti", "iss", "aud"]})
        if claims["sub"] != config["username"] or not isinstance(claims["jti"], str):
            raise ValueError()
        session = db.get(AdminSession, session_id(claims["jti"]))
        if session is None or session.expires_at <= time.time():
            raise ValueError()
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(401, "Session expired or invalid. Please log in again.") from None
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        check_origin(request)
    return session


# Single-process login throttling; deploy one worker or replace with a shared limiter.
attempts = []
attempt_lock = threading.Lock()


def verify_credentials(username: str, password: str):
    config = settings()
    with attempt_lock:
        now = time.monotonic()
        attempts[:] = [stamp for stamp in attempts if now - stamp < 60]
        if len(attempts) >= 10:
            raise HTTPException(429, "Too many login attempts. Try again in one minute.", headers={"Retry-After": "60"})
        attempts.append(now)
    try:
        valid = hasher.verify(config["hash"], password)
    except (VerificationError, InvalidHashError):
        valid = False
    name_matches = secrets.compare_digest(username.encode(), config["username"].encode())
    if not valid or not name_matches:
        raise HTTPException(401, "Invalid username or password.")


def issue_session(db: Session):
    config = settings()
    now = int(time.time())
    token_id = secrets.token_urlsafe(32)
    db.query(AdminSession).filter(AdminSession.expires_at <= now).delete()
    db.add(AdminSession(id=session_id(token_id), expires_at=now + TTL))
    db.commit()
    token = jwt.encode({"sub": config["username"], "jti": token_id, "iat": now,
                        "exp": now + TTL, "iss": "grievanceai", "aud": "grievanceai-admin"},
                       config["secret"], algorithm="HS256")
    return token
