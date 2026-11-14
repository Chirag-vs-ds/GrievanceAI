# Repository Audit

Audit date: 14 November 2026. This audit inspected filenames, source configuration, manifests, route definitions, tests, model loading, documentation, and Git metadata without displaying secret values or modifying application behavior, the database, or model artifacts.

## Actual top-level structure

| Path | Verified purpose |
| --- | --- |
| `backend/` | FastAPI application, SQLAlchemy mapping, services, admin provisioning, and isolated tests |
| `dataset/` | Synthetic development, validation, holdout, and evaluation CSV files |
| `frontend/` | Next.js App Router application, styles, static assets, and npm manifests |
| `models/` | Active Model B plus separate experimental Joblib artifacts |
| `notebooks/` | Exploratory data analysis notebook |
| `reports/` | Model audits/comparisons, demo-readiness material, and blind-test preparation |
| `src/` | ML data preparation, training, prediction, evaluation, and comparison scripts |
| `docs/` | Portfolio documentation added by this preparation pass |

Local-only directories/files present at audit time include `venv/`, `.venv/`, `.vscode/`, Python caches, Next.js build output, `debug.log`, the PowerShell `Microsoft/` cache, root `.env`, and `backend/.env`. They belong outside a public commit.

## Entry points and dependencies

- Backend application: `backend/app/main.py`
- Frontend root layout: `frontend/src/app/layout.tsx`
- Frontend routes: `/`, `/submit`, `/track`, `/admin/login`, and `/admin`
- Backend runtime dependencies: `backend/requirements.txt`
- ML/notebook dependencies: root `requirements.txt`
- Frontend dependencies and scripts: `frontend/package.json` and `frontend/package-lock.json`
- Frontend API proxy: `frontend/next.config.ts`

The backend manifest includes FastAPI, Uvicorn, Pydantic, scikit-learn, Joblib, pandas, NumPy, SQLAlchemy, PyMySQL, python-dotenv, argon2-cffi, and PyJWT. The frontend manifest includes Next.js, React, Recharts, Lucide React, TypeScript, Tailwind CSS, and ESLint.

## ML implementation

- Production loading and prediction: `backend/app/services/ml_service.py`
- Model B build script: `src/finalize_model.py`
- Active artifact: `models/grievance_classifier.joblib`
- Data preparation and baseline experiments: scripts under `src/`
- Experimental Model D and OTP/address scripts/artifacts: separate named files under `src/` and `models/`
- Development and comparison evidence: `dataset/` and `reports/`

The service path proves Model B remains active. The artifact hash was unchanged after documentation work. No model was fitted, replaced, or evaluated during this portfolio pass.

## Database configuration

`backend/app/database/connection.py` reads `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` from the root `.env`, builds a MySQL/PyMySQL URL with SQLAlchemy `URL.create`, and exposes a session dependency. SQLAlchemy models map `grievances` and `activity_logs`; the authentication service maps `admin_sessions`. The audit did not create, migrate, query, or modify MySQL data.

## API inventory

- Public: API root, health, grievance submission/prediction, and grievance tracking
- Admin authentication: login, current session, and logout
- Protected management: grievance listing/filtering and status update
- Protected reporting: analytics summary and paginated/filterable activity logs

The exact methods and paths are listed in the root README.

## Authentication

`backend/app/services/admin_auth.py` and `backend/app/routes/admin_auth.py` implement a single configured administrator with Argon2 verification, signed JWTs, HttpOnly cookies, exact-origin checks, per-process login throttling, database-backed session revocation, and login/logout audit events. Admin settings are stored separately from database variables in `backend/.env`. No credential value was read into audit output.

## Tests and commands

The primary backend suite is `backend/test_admin_auth.py`:

```powershell
.\venv\Scripts\python.exe -B -m unittest backend.test_admin_auth -v
```

It contains ten isolated workflow/security tests using in-memory SQLite and generated credentials. Files named `test_*.py` also exist in `backend/app/database/` and `src/`; some are direct diagnostic or model scripts rather than the routine isolated suite and should be reviewed before broad test discovery.

Frontend verification commands are:

```powershell
Set-Location frontend
npm run lint
npm run build
```

At audit completion, all ten backend tests and the production build passed. ESLint reported zero errors and two existing unused imports (`Phone` and `Mail`) in `frontend/src/app/page.tsx`.

## Existing documentation and images

Verified existing documentation includes `backend/ADMIN_AUTH.md`, model/evaluation reports under `reports/`, blind-test annotation guidance, the generated Create Next App `frontend/README.md`, and the previously minimal root README (replaced by the portfolio README). Static SVGs under `frontend/public/` are framework assets. No genuine application screenshots were found.

## Git security findings

- The project root is not currently a Git repository.
- `frontend/` contains a separate nested Git repository with no configured remote.
- The nested frontend index had no tracked `.env`/credential/key filenames and no tracked private-key or explicit secret-assignment markers in the targeted scan.
- Its working tree contains modified and untracked application files. Nothing was staged, committed, pushed, or published.
- Because the root has no Git metadata, a historical tracked-secret audit for the whole project is impossible. The files that would form the future root repository have not yet been indexed.
- Root `.env` and `backend/.env` exist and are covered by the root `.gitignore`; their values were not printed.
- The root ignore file now covers environments, caches, bytecode, Node/Next builds, logs, temporary files, local databases/exports, credential file extensions, local tool caches, and coordinator-only blind-test metadata.
- Source, docs, manifests, requirements, datasets/reports, and `models/grievance_classifier.joblib` remain eligible for inclusion.

Before creating a root repository, decide how to handle the nested `frontend/.git` directory. Removing or relocating Git metadata changes repository structure and was deliberately not done without approval. After resolving that choice, initialize the root repository, inspect `git status`, inspect the complete candidate file list, and run a secret scanner before the first commit.

## Files that must not be committed

- `.env`, `backend/.env`, and any other secret environment files
- `venv/`, `.venv/`, `node_modules/`, `.next/`, and other generated build/cache directories
- Python bytecode, coverage output, logs, temporary files, and local databases/dumps
- Private keys, certificates containing private material, and credential exports
- `reports/blind_test/preparation_v1/author_coverage_DO_NOT_SEND_TO_REVIEWERS.csv`

The active production model artifact is intentionally not ignored. Before publication, separately decide which large experimental models, datasets, and reports provide portfolio value and check GitHub file-size limits; do not delete them as part of that review.

## Publication blockers and follow-ups

1. Resolve the nested frontend Git repository before initializing a repository at the project root.
2. Capture and review the nine real application screenshots.
3. Add a verified author name and profile links.
4. Decide on a license; none is present.
5. Fix or consciously accept the two frontend lint warnings.
6. Replace the default Create Next App metadata/title in `frontend/src/app/layout.tsx` during a separately approved UI-polish change.
7. Perform a final candidate-file and secret scan after Git initialization and before any commit or push.
