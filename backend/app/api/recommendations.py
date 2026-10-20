from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database.session import get_db
from app.models.station import Station
from app.schemas.recommendation import RecommendationRequest, RankedStationOut
from app.dsa_bridge import get_dsa_bridge, StationCandidate

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


def _explain(r, ranked_list) -> str:
    """Build human explanation from ranking factors."""
    reasons = []
    if r.available_chargers > 0:
        reasons.append(f"{r.available_chargers} charger(s) available now")
    else:
        reasons.append("currently busy (waiting time estimated)")
    if r.distance_km <= 3:
        reasons.append(f"very close ({r.distance_km} km)")
    elif r.distance_km <= 8:
        reasons.append(f"nearby ({r.distance_km} km, ~{int(r.travel_time_min)} min)")
    else:
        reasons.append(f"{r.distance_km} km away (~{int(r.travel_time_min)} min travel)")
    if ranked_list:
        min_cost = min(x.cost_per_kwh for x in ranked_list)
        if r.cost_per_kwh <= min_cost + 0.5:
            reasons.append(f"competitive price (₹{r.cost_per_kwh}/kWh)")
    if r.connector_types:
        reasons.append("supports " + ", ".join(r.connector_types))
    return "Recommended because: " + "; ".join(reasons) + "."


@router.post("/", response_model=List[RankedStationOut])
def recommend_stations(body: RecommendationRequest, db: Session = Depends(get_db)):
    stations = (
        db.query(Station)
        .options(joinedload(Station.chargers))
        .filter(Station.is_active == True)
        .all()
    )
    bridge = get_dsa_bridge()
    candidates: List[StationCandidate] = []
    meta = {}

    for s in stations:
        dist = bridge.haversine_km(body.latitude, body.longitude, s.latitude, s.longitude)
        if dist > body.max_distance_km:
            continue

        chargers = [c for c in s.chargers if not c.is_faulty]
        if body.connector_type:
            chargers = [c for c in chargers if c.connector_type.lower() == body.connector_type.lower()]
        if body.min_power_kw is not None:
            chargers = [c for c in chargers if c.power_kw >= body.min_power_kw]
        if body.max_price is not None:
            chargers = [c for c in chargers if c.price_per_kwh <= body.max_price]

        if not chargers:
            continue

        avail = sum(1 for c in chargers if c.is_available)
        if body.available_only and avail == 0:
            continue

        avg_price = sum(c.price_per_kwh for c in chargers) / len(chargers)
        power_max = max(c.power_kw for c in chargers)
        travel_min = (dist / 30.0) * 60.0
        wait = 0.0 if avail > 0 else 20.0

        candidates.append(
            StationCandidate(
                station_id=s.id,
                distance_km=dist,
                travel_time_min=travel_min,
                waiting_time_min=wait,
                cost_per_kwh=avg_price,
                available_chargers=avail,
                compatible=1,
            )
        )
        meta[s.id] = {
            "station": s,
            "connectors": list({c.connector_type for c in chargers}),
            "power_max": power_max,
            "avail": avail,
        }

    ranked = bridge.rank_stations(
        candidates,
        w_distance=body.w_distance,
        w_time=body.w_time,
        w_wait=body.w_wait,
        w_cost=body.w_cost,
    )

    result = []
    for r in ranked:
        m = meta.get(r.station_id)
        if not m:
            continue
        s = m["station"]
        out = RankedStationOut(
            station_id=s.id,
            name=s.name,
            address=s.address,
            latitude=s.latitude,
            longitude=s.longitude,
            score=round(r.score, 4),
            distance_km=round(r.distance_km, 2),
            travel_time_min=round(r.travel_time_min, 1),
            waiting_time_min=round(r.waiting_time_min, 1),
            cost_per_kwh=round(r.cost_per_kwh, 2),
            available_chargers=m["avail"],
            connector_types=m["connectors"],
            power_kw_max=m["power_max"],
            city=s.city,
        )
        result.append(out)

    for out in result:
        out.explanation = _explain(out, result)

    return result
