# EV Charge — System Architecture

## Overview

EV Charge is a three-tier intelligent EV charging management platform:

1. **Presentation** — React SPA (Vite + Tailwind + Leaflet)
2. **Application** — FastAPI REST API with JWT auth and role-based access
3. **Domain algorithms** — C shared library (DSA engine) for ranking, routing and conflict detection
4. **Persistence** — PostgreSQL (or SQLite for demos) via SQLAlchemy

## Data flow (recommendation + booking)

```
User (React)
  → POST /api/recommendations/  {lat, lon, connector, weights}
  → FastAPI loads stations + chargers from DB
  → DSA bridge builds StationCandidate list
  → rank_stations() (C or pure-Python mirror)
  → RankedStationOut[] returned to UI

User selects charger + time
  → POST /api/bookings/
  → Load existing intervals for charger
  → has_booking_conflict() (DSA)
  → Transaction insert Booking
  → Confirmation
```

## C DSA engine

Compiled to `libdsa_engine.so`. Key modules:

- `graph` + `dijkstra` — adjacency-list graph, binary-heap Dijkstra
- `min_heap` — priority queue for best score
- `station_ranker` — normalize factors, weighted score, heap extract
- `queue` — circular waiting queue
- `booking_intervals` — overlap test + free-slot search
- `merge_sort`, `hash_table` — supporting structures

Python `dsa_bridge` loads the `.so` when available and always provides a pure-Python implementation that mirrors the same algorithms for reliability in demos.

## Roles

| Role | Capabilities |
|------|----------------|
| ev_owner | Discover, rank, book, cancel, view own bookings |
| operator | Manage assigned stations/chargers (Phase 5 UI) |
| admin | Platform stats, users, stations (Phase 5 UI) |

All roles share one JWT authentication system.
