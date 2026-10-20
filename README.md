# EV Charge — Intelligent EV Charging Management System

Full-stack academic project: **React + FastAPI + C DSA engine + SQLite/PostgreSQL**.

## Features (all phases complete)

- **EV Owner:** discover/rank stations, book slots, manage vehicles, notifications, bookings
- **Operator:** manage stations & chargers, view reservations, fault reports
- **Admin:** platform stats, user management
- **C DSA engine:** graph/Dijkstra, min-heap ranking, interval conflict detection, queue
- **Map:** Leaflet + OpenStreetMap

## Quick start

```bash
# 1. C DSA
cd dsa_engine && make all

# 2. Backend
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd ../frontend
npm install && npm run dev
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| API docs | http://localhost:8000/docs |

### Demo logins

| Email | Password | Role |
|-------|----------|------|
| owner@evcharge.com | password123 | EV Owner |
| operator@evcharge.com | password123 | Operator |
| admin@evcharge.com | password123 | Admin |

## Structure

```
ev-charge/
├── frontend/          React + Vite + Tailwind + Leaflet
├── backend/app/
│   ├── api/           auth, stations, bookings, recommendations,
│   │                  vehicles, notifications, operator, admin
│   ├── models/ schemas/ services/ database/ dsa_bridge/
│   └── main.py
├── dsa_engine/        C library
├── docs/              architecture, algorithms, deployment
└── README.md
```

## Tests

```bash
cd backend && pytest tests/ -v
cd dsa_engine && make test
```

See `docs/deployment.md` for production notes.

## Phase status

| Phase | Status |
|-------|--------|
| 1 UI | Done |
| 2 Backend + DB | Done |
| 3 C DSA | Done |
| 4 Integration | Done |
| 5 Vehicles, notifications, operator & admin | Done |
| 6 Tests + deployment docs | Done |
