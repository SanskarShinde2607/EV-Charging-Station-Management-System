# Deployment Guide — EV Charge

## Local development (recommended first)

### Prerequisites
- Python 3.10+
- Node.js 18+
- gcc (for C DSA engine)
- Optional: PostgreSQL 14+

### Steps

```bash
# 1. C engine
cd dsa_engine
make all
# optional: make test

# 2. Backend
cd ../backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- API: http://localhost:8000  
- Docs: http://localhost:8000/docs  
- App: http://localhost:5173  

### Demo accounts
| Email | Password | Role |
|-------|----------|------|
| owner@evcharge.com | password123 | EV Owner |
| operator@evcharge.com | password123 | Operator |
| admin@evcharge.com | password123 | Admin |

## PostgreSQL (production DB)

```bash
export DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/evcharge
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Tables are created automatically on startup. For migrations later, use Alembic under `database/migrations/`.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `sqlite:///./ev_charge.db` | Database connection |
| `SECRET_KEY` | dev secret | JWT signing key — **change in production** |
| `VITE_API_URL` | `http://localhost:8000/api` | Frontend API base URL |

## Production checklist

1. Set a strong `SECRET_KEY`.
2. Use PostgreSQL, not SQLite.
3. Switch password hashing to bcrypt/argon2 (see `auth_service.py` note).
4. Build frontend: `cd frontend && npm run build` → serve `dist/` via nginx.
5. Run uvicorn behind nginx/caddy with HTTPS.
6. Restrict CORS `allow_origins` to your domain.
7. Place `libdsa_engine.so` where the bridge can find it (or rely on pure-Python fallback).

## Docker (optional sketch)

```dockerfile
# backend
FROM python:3.12-slim
RUN apt-get update && apt-get install -y gcc
WORKDIR /app
COPY backend/ dsa_engine/ ./
RUN cd dsa_engine && make all
RUN pip install -r backend/requirements.txt
WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Tests

```bash
cd backend
pip install pytest httpx
pytest tests/ -v

cd ../dsa_engine
make test   # or compile test_runner manually
```

## Phase status

| Phase | Status |
|-------|--------|
| 1 UI | Done |
| 2 Backend + DB | Done |
| 3 C DSA | Done |
| 4 Integration | Done |
| 5 Vehicles, notifications, operator & admin dashboards | Done |
| 6 Tests + deployment docs | Done |
