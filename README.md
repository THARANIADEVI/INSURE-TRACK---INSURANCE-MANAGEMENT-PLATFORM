# Insurance Management Platform

A full-stack insurance management system: customer, policy, claim, premium and
document management with role-based access (admin / agent / customer),
reporting (PDF/Excel export, QR codes), OCR-assisted document verification,
and audit logging.

- **Backend**: Flask + SQLAlchemy + Flask-Migrate + Flask-JWT-Extended (REST API)
- **Frontend**: React 19 + Vite + Tailwind CSS + React Router

## Project structure

```
backend/    Flask API (routes, models, schemas, tests)
frontend/   React SPA (Vite)
render.yaml Render Blueprint for the backend
```

## Local development

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows Git Bash; use venv\Scripts\activate.bat on cmd
pip install -r requirements.txt
cp .env.example .env           # then edit SECRET_KEY / JWT_SECRET_KEY
flask db upgrade
python app.py                  # runs on http://127.0.0.1:5000
```

Run the test suite:

```bash
cd backend
python -m pytest tests/ -q
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional locally; dev server proxies /api to localhost:5000 by default
npm run dev             # runs on http://127.0.0.1:5173
```

## API summary

All endpoints are prefixed with `/api`. JWT bearer tokens (access + refresh)
are used for auth; role checks (`admin`, `agent`, `customer`) are enforced
per-route.

| Prefix               | Resource                                   |
|-----------------------|--------------------------------------------|
| `/api/auth`           | Register, login, refresh, current user      |
| `/api/customers`      | Customer records                            |
| `/api/policies`       | Insurance policies                          |
| `/api/claims`         | Claims, assignment, review                  |
| `/api/premiums`       | Premium payments                            |
| `/api/documents`      | Document upload/download, OCR, verification |
| `/api/reports`        | PDF/Excel report export, QR codes           |
| `/api/audit-logs`     | Audit trail                                 |
| `/api/notifications`  | In-app notifications                        |
| `/api/employees`      | Admin-only staff (agent/admin) provisioning |
| `/api/settings`       | Admin settings                              |
| `/api/health`         | Health check                                |

Public self-registration (`/api/auth/register`) always creates a `customer`
account; `admin`/`agent` accounts can only be created via the admin-only
`/api/employees` endpoint.

## Deployment

### Backend on Render

This repo includes a `render.yaml` Blueprint at the project root.

1. Push this repo to GitHub.
2. In Render, choose **New > Blueprint**, point it at the repo, and Render
   will read `render.yaml` and provision:
   - a free Postgres database (`insurance-db`)
   - a web service (`insurance-backend`) with `SECRET_KEY`/`JWT_SECRET_KEY`
     auto-generated and `DATABASE_URL` wired to the database
3. After the first deploy, edit the `CORS_ORIGINS` env var on the service to
   your real Vercel frontend URL (comma-separated if you have more than one),
   e.g. `https://your-app.vercel.app`.
4. Note: the free plan has no persistent disk, so `uploads/` and `reports/`
   are wiped on every redeploy/restart. For real document persistence, add a
   paid Render disk or move uploads to S3-compatible storage.

If you'd rather configure it by hand in the Render dashboard instead of the
Blueprint, use:
- **Root directory**: `backend`
- **Build command**: `pip install -r requirements.txt`
- **Start command**: `flask db upgrade && gunicorn --bind 0.0.0.0:$PORT app:app`
- **Env vars**: `FLASK_APP=app.py`, `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`

### Frontend on Vercel

1. Import the repo into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite (build command `npm run build`, output `dist` —
   already declared in `frontend/vercel.json`).
4. Add an environment variable `VITE_API_URL` set to your Render backend's
   API base URL, e.g. `https://insurance-backend.onrender.com/api`.
5. Deploy. Client-side routing (React Router) is handled via the SPA rewrite
   in `frontend/vercel.json`.

## Secrets

Never commit real secrets. `backend/.env` and `frontend/.env` are gitignored;
use the `.env.example` files as templates. Generate strong random secrets for
`SECRET_KEY` / `JWT_SECRET_KEY` before deploying anywhere beyond local dev,
e.g.:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

(On Render via the Blueprint above, these are auto-generated for you.)
