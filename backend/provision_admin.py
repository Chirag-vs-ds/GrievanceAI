"""Run interactively from project root: python -m backend.provision_admin."""
import getpass
import re
import secrets
from pathlib import Path

from dotenv import dotenv_values
from backend.app.database.connection import engine
from backend.app.services.admin_auth import AdminSession, hasher


def main():
    target = Path(__file__).resolve().parent / ".env"
    existing = dotenv_values(target) if target.exists() else {}
    keys = {"ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", "ADMIN_JWT_SECRET"}
    if keys.intersection(existing):
        raise SystemExit("Admin configuration already exists; refusing to overwrite it.")
    username = input("Admin username: ").strip()
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,100}", username):
        raise SystemExit("Use 3-100 letters, digits, underscores, dots or hyphens.")
    password = getpass.getpass("Admin password (at least 15 characters): ")
    if len(password) < 15 or len(password) > 1024:
        raise SystemExit("Password must contain 15-1024 characters.")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")
    values = {"ADMIN_USERNAME": username, "ADMIN_PASSWORD_HASH": hasher.hash(password),
              "ADMIN_JWT_SECRET": secrets.token_urlsafe(48), "ADMIN_COOKIE_SECURE": "false",
              "ADMIN_ALLOWED_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000"}
    # Only create our new session table; never recreate the grievances table.
    AdminSession.__table__.create(engine, checkfirst=True)
    with target.open("a", encoding="utf-8") as output:
        output.write("\n# Single-admin authentication\n")
        for key, value in values.items():
            if key not in existing:
                output.write(f"{key}='{value}'\n")
    print("Admin provisioned. Restart FastAPI. Use HTTPS and ADMIN_COOKIE_SECURE=true for deployment.")


if __name__ == "__main__":
    main()
