# Single-admin setup

From the project root, using the virtual environment:

```powershell
.\venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\venv\Scripts\python.exe -m backend.provision_admin
```

Enter the username and a unique password of at least 15 characters at the prompts.
Password prompts are hidden. The script writes only an Argon2id hash and a generated
JWT secret into `backend/.env`. Existing values are preserved; existing admin
credentials cause provisioning to stop. The existing root `.env` still supplies
MySQL settings. Both files are ignored by Git; restrict their filesystem access to
the application operator. Never copy their contents into logs or source control.

Provisioning creates only the new `admin_sessions` table using the existing
SQLAlchemy engine. It does not alter `grievances`. This table stores hashed session
identifiers and expiration times, enabling logout revocation across restarts/workers.
Expired rows are removed on subsequent logins.

Restart FastAPI and Next.js after setup, then open
`http://localhost:3000/admin/login`. Admin requests use the Next.js `/api` rewrite
to avoid cross-site cookies between `localhost` and `127.0.0.1`.
Cookies are host-only, HttpOnly, SameSite=Lax, scoped to `/api`, and expire in
30 minutes. No JWT is returned in JSON or stored in browser storage.

`ADMIN_COOKIE_SECURE=false` is provisioned solely for local HTTP development.
For deployment set it to `true`, use HTTPS, configure `ADMIN_ALLOWED_ORIGINS`
as an exact comma-separated list of trusted frontend origins, and update CORS
and the Next.js rewrite destination for the deployed network. Missing or invalid
auth configuration fails closed. Login and authenticated mutations require a
trusted Origin header as CSRF protection. CLI clients must supply that header.

Login throttling allows ten attempts per minute per process. Run one worker for
this prototype; production needs a shared rate limiter/reverse-proxy controls,
HTTPS, operational monitoring and a deployment security review.

To rotate credentials, generate a fresh Argon2id hash with a hidden-password
prompt and replace the protected configuration through your secret management
process. Rotate `ADMIN_JWT_SECRET` and restart all workers to invalidate all
existing tokens. Do not put a password or secret in command-line arguments.

Run isolated backend checks (no MySQL writes):

```powershell
.\venv\Scripts\python.exe -m unittest backend.test_admin_auth -v
```

Tests use randomly generated credentials, an in-memory SQLite database and actual
API routes/ML inference. They verify public citizen workflows, protected routes,
login, revocation, expiration/signature/issuer/audience checks, CSRF and throttling.

After provisioning, verify in a browser: open `/admin` while signed out (it should
redirect), reject an incorrect password, sign in successfully, load analytics,
update a fictional grievance status, and log out. Reopening `/admin` must require
login again. Check expiry after 30 minutes. Browser validation remains necessary;
passing the backend tests and frontend build alone is not a full security sign-off.
