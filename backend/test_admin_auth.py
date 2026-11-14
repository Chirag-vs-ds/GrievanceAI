"""Isolated auth integration tests; never writes to the configured MySQL DB."""
import os
import secrets
import time
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database.connection import Base, get_db
from backend.app.database.models import ActivityLog
from backend.app.services import admin_auth as auth
from backend.app.services.activity_service import log_auth_activity
from fastapi import HTTPException


class AdminAuthTests(unittest.TestCase):
    def setUp(self):
        self.password = secrets.token_urlsafe(24)
        self.secret = secrets.token_urlsafe(48)
        self.env = patch.dict(os.environ, {
            "ADMIN_USERNAME": "test-admin", "ADMIN_PASSWORD_HASH": auth.hasher.hash(self.password),
            "ADMIN_JWT_SECRET": self.secret, "ADMIN_COOKIE_SECURE": "false",
            "ADMIN_ALLOWED_ORIGINS": "http://localhost:3000",
        })
        self.env.start()
        auth.settings.cache_clear()
        auth.attempts.clear()
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.factory = sessionmaker(bind=self.engine)

        def test_db():
            with self.factory() as db:
                yield db

        app.dependency_overrides[get_db] = test_db
        self.client = TestClient(app, base_url="http://localhost:3000", headers={"Origin": "http://localhost:3000"})

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.engine.dispose()
        self.env.stop()
        auth.settings.cache_clear()

    def login(self):
        response = self.client.post("/api/admin/login", json={"username": "test-admin", "password": self.password})
        self.assertEqual(response.status_code, 200)
        self.assertIn("HttpOnly", response.headers["set-cookie"])
        self.assertIn("SameSite=lax", response.headers["set-cookie"])
        self.assertNotIn("token", response.json())
        return self.client.cookies.get(auth.COOKIE)

    def test_full_workflow(self):
        for url in ["/api/admin/analytics/summary", "/api/grievances/", "/api/admin/me", "/api/admin/activity-logs"]:
            self.assertEqual(self.client.get(url).status_code, 401)
        self.assertEqual(self.client.patch("/api/grievances/fictional/status", json={"status": "Resolved"}).status_code, 401)
        bad = self.client.post("/api/admin/login", json={"username": "test-admin", "password": "incorrect"})
        self.assertEqual(bad.status_code, 401)
        # Actual prediction, persistence and tracking against isolated SQLite.
        submitted = self.client.post("/api/grievances/predict", json={"complaint": "Fictional test: my authentication OTP is not arriving."})
        self.assertEqual(submitted.status_code, 200, submitted.text)
        gid = submitted.json()["grievance_id"]
        self.assertEqual(self.client.get(f"/api/grievances/{gid}").status_code, 200)
        token = self.login()
        self.assertEqual(self.client.get("/api/admin/me").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/analytics/summary").status_code, 200)
        self.assertEqual(self.client.get("/api/grievances/").status_code, 200)
        updated = self.client.patch(f"/api/grievances/{gid}/status", json={"status": "Resolved"})
        self.assertEqual(updated.status_code, 200)
        logs = self.client.get("/api/admin/activity-logs?action_type=STATUS_UPDATE").json()
        self.assertEqual(logs["total"], 1)
        activity = logs["activity_logs"][0]
        self.assertEqual(activity["admin_username"], "test-admin")
        self.assertEqual(activity["action_type"], "STATUS_UPDATE")
        self.assertEqual(activity["grievance_id"], gid)
        self.assertEqual(activity["previous_status"], "Pending")
        self.assertEqual(activity["new_status"], "Resolved")
        self.assertEqual(self.client.get(f"/api/grievances/{gid}").json()["status"], "Resolved")
        self.assertEqual(self.client.post("/api/admin/logout").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/me").status_code, 401)
        self.client.cookies.set(auth.COOKIE, token)
        self.assertEqual(self.client.get("/api/admin/me").status_code, 401, "Logged-out JWT must not be reusable")

    def test_activity_logs_pagination_and_filtering(self):
        self.login()
        timestamp = datetime(2026, 1, 1)
        with self.factory() as db:
            for index, action in enumerate(["STATUS_UPDATE", "TEST", "STATUS_UPDATE"]):
                db.add(ActivityLog(
                    admin_username="test-admin", action_type=action,
                    created_at=timestamp + timedelta(seconds=min(index, 1)),
                ))
            db.commit()

        response = self.client.get("/api/admin/activity-logs")
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual((result["total"], result["page"], result["limit"]), (4, 1, 10))
        self.assertEqual([row["id"] for row in result["activity_logs"]], [1, 4, 3, 2])
        self.assertEqual(set(result["activity_logs"][0]), {
            "id", "admin_username", "action_type", "grievance_id",
            "previous_status", "new_status", "created_at",
        })
        response = self.client.get("/api/admin/activity-logs", params={
            "action_type": "STATUS_UPDATE", "page": 2, "limit": 1,
        })
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual((result["total"], result["page"], result["limit"]), (2, 2, 1))
        self.assertEqual([row["id"] for row in result["activity_logs"]], [2])
        for params in [{"page": 10}, {"action_type": "UNKNOWN"}]:
            self.assertEqual(self.client.get("/api/admin/activity-logs", params=params).json()["activity_logs"], [])
        for params in [{"page": 0}, {"limit": 0}, {"limit": 101}]:
            self.assertEqual(self.client.get("/api/admin/activity-logs", params=params).status_code, 422)

    def test_authentication_audit_records(self):
        bad = self.client.post("/api/admin/login", json={"username": "fictional-user", "password": "incorrect"})
        self.assertEqual(bad.status_code, 401)
        token = self.login()
        self.assertEqual(self.client.post("/api/admin/logout").status_code, 200)
        self.client.cookies.set(auth.COOKIE, token)
        self.assertEqual(self.client.post("/api/admin/logout").status_code, 401)
        with self.factory() as db:
            records = db.query(ActivityLog).order_by(ActivityLog.id).all()
            self.assertEqual([row.action_type for row in records], ["ADMIN_LOGIN_FAILED", "ADMIN_LOGIN", "ADMIN_LOGOUT"])
            self.assertEqual([row.admin_username for row in records], ["fictional-user", "test-admin", "test-admin"])
            for row in records:
                self.assertIsNotNone(row.created_at)
                self.assertIsNone(row.grievance_id)
                self.assertIsNone(row.previous_status)
                self.assertIsNone(row.new_status)
                stored = str({column.name: getattr(row, column.name) for column in ActivityLog.__table__.columns})
                for sensitive in [self.password, "incorrect", token, self.secret, auth.settings()["hash"]]:
                    self.assertNotIn(sensitive, stored)
            self.assertEqual(db.query(auth.AdminSession).count(), 0)

    def test_audit_failure_preserves_authentication_and_revocation(self):
        with patch("backend.app.services.activity_service.log_activity", side_effect=RuntimeError("audit unavailable")):
            bad = self.client.post("/api/admin/login", json={"username": "test-admin", "password": "incorrect"})
            self.assertEqual(bad.status_code, 401)
            token = self.login()
            self.assertEqual(self.client.post("/api/admin/logout").status_code, 200)
        self.client.cookies.set(auth.COOKIE, token)
        self.assertEqual(self.client.get("/api/admin/me").status_code, 401)

    def test_invalid_usernames_and_throttling(self):
        for name in [None, "", 123, "x" * 101]:
            response = self.client.post("/api/admin/login", json={"username": name, "password": "incorrect"})
            self.assertEqual(response.status_code, 422)
        auth.attempts[:] = [time.monotonic()] * 10
        self.assertEqual(self.client.post("/api/admin/login", json={"username": "test-admin", "password": "incorrect"}).status_code, 429)
        with self.factory() as db:
            self.assertEqual(db.query(ActivityLog).count(), 0)

    def test_session_creation_failure_is_not_logged_as_success(self):
        with patch("backend.app.routes.admin_auth.issue_session", side_effect=HTTPException(503, "Session unavailable")):
            response = self.client.post("/api/admin/login", json={"username": "test-admin", "password": self.password})
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("set-cookie", response.headers)
        with self.factory() as db:
            self.assertEqual(db.query(ActivityLog).count(), 0)

    def test_revocation_failure_does_not_claim_success(self):
        self.login()
        with patch("sqlalchemy.orm.Session.commit", side_effect=RuntimeError("database unavailable")):
            response = self.client.post("/api/admin/logout")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("set-cookie", response.headers)
        with self.factory() as db:
            self.assertEqual(db.query(ActivityLog).filter_by(action_type="ADMIN_LOGOUT").count(), 0)
        # A retry can still revoke the session after the database recovers.
        self.assertEqual(self.client.post("/api/admin/logout").status_code, 200)

    def test_audit_username_storage_limits(self):
        with self.factory() as db:
            log_auth_activity(db, "x" * 150, "ADMIN_LOGIN_FAILED")
            log_auth_activity(db, None, "ADMIN_LOGIN_FAILED")
            rows = db.query(ActivityLog).order_by(ActivityLog.id).all()
            self.assertEqual(rows[0].admin_username, "x" * 100)
            self.assertEqual(rows[1].admin_username, "<missing>")

    def test_token_validation_and_csrf(self):
        token = self.login()
        claims = jwt.decode(token, self.secret, algorithms=["HS256"], audience="grievanceai-admin", issuer="grievanceai")
        for key, value in [("exp", int(time.time()) - 1), ("aud", "wrong"), ("iss", "wrong"), ("sub", "other")]:
            invalid = jwt.encode({**claims, key: value}, self.secret, algorithm="HS256")
            self.client.cookies.clear()
            self.client.cookies.set(auth.COOKIE, invalid)
            self.assertEqual(self.client.get("/api/admin/me").status_code, 401)
        self.client.cookies.clear()
        self.client.cookies.set(auth.COOKIE, jwt.encode(claims, secrets.token_urlsafe(48), algorithm="HS256"))
        self.assertEqual(self.client.get("/api/admin/me").status_code, 401)
        self.client.cookies.clear()
        self.client.cookies.set(auth.COOKIE, token)
        self.assertEqual(self.client.post("/api/admin/logout", headers={"Origin": "https://evil.example"}).status_code, 403)
        self.assertEqual(self.client.patch("/api/grievances/test/status", json={"status": "Resolved"}, headers={"Origin": "https://evil.example"}).status_code, 403)
        self.assertEqual(self.client.post("/api/admin/login", json={"username": "test-admin", "password": self.password}, headers={"Origin": "https://evil.example"}).status_code, 403)

    def test_secure_cookie_and_throttle(self):
        with patch.dict(os.environ, {"ADMIN_COOKIE_SECURE": "true"}):
            auth.settings.cache_clear()
            response = self.client.post("/api/admin/login", json={"username": "test-admin", "password": self.password})
            self.assertIn("Secure", response.headers["set-cookie"])
        auth.attempts[:] = [time.monotonic()] * 10
        self.assertEqual(self.client.post("/api/admin/login", json={"username": "test-admin", "password": self.password}).status_code, 429)


if __name__ == "__main__":
    unittest.main()
