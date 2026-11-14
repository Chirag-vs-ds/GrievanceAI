# GrievanceAI Demo Guide

This walkthrough demonstrates the local application with fictional data. GrievanceAI is a portfolio prototype, not an official UIDAI or government service.

## Start the services

Confirm the existing MySQL schema and both protected environment files are present. Do not open or share their values during a recording or interview.

In elevated PowerShell, check and start the default MySQL service:

```powershell
Get-Service MySQL80
Start-Service MySQL80
```

If it is already running, the second command is unnecessary. If your installation uses another service name, use that installed name rather than creating another database.

Start FastAPI from the project root:

```powershell
# Run these commands from the cloned repository root.
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

Check `http://127.0.0.1:8000/health`. Swagger UI is at `http://127.0.0.1:8000/docs`.

In another PowerShell window, start Next.js:

```powershell
Set-Location .\frontend
npm run dev
```

Open `http://localhost:3000`. Keep this exact host and port for admin operations because trusted origins are matched exactly.

## Submit a fictional grievance

1. Select **Submit a Grievance**.
2. Enter a synthetic complaint such as: `The fictional demo portal stops responding when I upload a sample document.`
3. Avoid real identifiers, contact details, authentication codes, biometrics, or citizen records.
4. Submit once and wait for confirmation.
5. Explain that category, department, and priority are recommendations for review.
6. Copy the generated grievance ID.

The submission is saved to MySQL. This guide does not delete demo records.

## Track it

1. Open **Track Your Grievance**.
2. Enter the generated grievance ID.
3. Confirm the complaint, category, department, priority, status, and timestamps appear.
4. Explain that public tracking currently depends on possession of the ID, a documented prototype limitation.

## Log in and review

1. Open `http://localhost:3000/admin/login`.
2. Enter the provisioned credentials privately. Never show or narrate the password.
3. Confirm `/admin` loads analytics and grievances.

If admin authentication has not been provisioned, follow `backend/ADMIN_AUTH.md`. Its command uses hidden prompts and preserves existing configuration. Never put credentials in commands, screenshots, recordings, or documentation.

## Update status

1. Locate the fictional grievance, using category or status filters if needed.
2. Change it from **Pending** to **In Progress**.
3. Wait for confirmation and verify the row changed.
4. Optionally track it in another window to show the persisted status.

Implemented status values are Pending, In Progress, and Resolved.

## Verify logs and analytics

1. Select **Activity Logs**.
2. Confirm a Status Update event shows the grievance and its previous/new status.
3. Demonstrate the action filter and, when enough records exist, pagination.
4. Explain that login, failed login, logout, and status changes are audited without passwords or raw tokens.
5. Return to **Overview & Grievances**.
6. Confirm total and status counts reflect the fictional grievance and update.
7. Review category, department, and priority charts.

The API calculates analytics from current MySQL records; the frontend does not hardcode them.

## Log out and verify protection

1. Select **Log out**.
2. Confirm the login page reports the ended session.
3. Navigate directly to `http://localhost:3000/admin`.
4. Confirm it redirects to login.
5. Optionally request a protected endpoint without a session and confirm HTTP 401.

Do not inspect or display the HttpOnly cookie in a public demo.

## Stop local services

Use `Ctrl+C` in both application terminals. Stop MySQL only if other local work does not need it:

```powershell
Stop-Service MySQL80
```

Stopping the service does not delete its database or records.
