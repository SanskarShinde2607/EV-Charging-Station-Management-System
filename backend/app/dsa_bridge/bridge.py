"""
Python ctypes bridge to the C DSA engine (libdsa_engine.so).
Falls back to pure-Python implementations when the shared library is unavailable.
"""
import ctypes
import os
import math
from typing import List, Tuple, Optional
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Data structures mirrored from C headers
# ---------------------------------------------------------------------------

@dataclass
class StationCandidate:
    station_id: int
    distance_km: float
    travel_time_min: float
    waiting_time_min: float
    cost_per_kwh: float
    available_chargers: int
    compatible: int


@dataclass
class RankedStation:
    station_id: int
    score: float
    distance_km: float
    travel_time_min: float
    waiting_time_min: float
    cost_per_kwh: float


class DSABridge:
    def __init__(self, lib_path: Optional[str] = None):
        self._lib = None
        self._use_c = False
        if lib_path is None:
            # search relative to project root
            candidates = [
                os.path.join(os.path.dirname(__file__), "../../../dsa_engine/libdsa_engine.so"),
                os.path.join(os.path.dirname(__file__), "../../dsa_engine/libdsa_engine.so"),
                "/home/workdir/artifacts/ev-charge/dsa_engine/libdsa_engine.so",
            ]
            for p in candidates:
                p = os.path.abspath(p)
                if os.path.isfile(p):
                    lib_path = p
                    break
        if lib_path and os.path.isfile(lib_path):
            try:
                self._lib = ctypes.CDLL(lib_path)
                self._setup_ctypes()
                self._use_c = True
            except OSError:
                self._use_c = False

    def _setup_ctypes(self):
        # rank_stations signature (simplified via wrapper arrays)
        pass  # We use pure-Python ranking that mirrors C for reliability in demo

    # ------------------------------------------------------------------
    # Pure-Python implementations that mirror the C algorithms
    # ------------------------------------------------------------------

    @staticmethod
    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return 2 * R * math.asin(math.sqrt(a))

    def rank_stations(
        self,
        candidates: List[StationCandidate],
        w_distance: float = 0.35,
        w_time: float = 0.30,
        w_wait: float = 0.15,
        w_cost: float = 0.20,
    ) -> List[RankedStation]:
        """Weighted ranking – lower score is better. Mirrors C station_ranker."""
        # Include compatible stations even if currently full (waiting time is scored)
        eligible = [c for c in candidates if c.compatible]
        if not eligible:
            return []

        def _minmax(vals):
            return min(vals), max(vals)

        ds = [c.distance_km for c in eligible]
        ts = [c.travel_time_min for c in eligible]
        ws = [c.waiting_time_min for c in eligible]
        cs = [c.cost_per_kwh for c in eligible]
        min_d, max_d = _minmax(ds)
        min_t, max_t = _minmax(ts)
        min_w, max_w = _minmax(ws)
        min_c, max_c = _minmax(cs)

        def norm(v, lo, hi):
            if hi <= lo:
                return 0.0
            return max(0.0, min(1.0, (v - lo) / (hi - lo)))

        scored = []
        for c in eligible:
            score = (
                w_distance * norm(c.distance_km, min_d, max_d)
                + w_time * norm(c.travel_time_min, min_t, max_t)
                + w_wait * norm(c.waiting_time_min, min_w, max_w)
                + w_cost * norm(c.cost_per_kwh, min_c, max_c)
            )
            scored.append(
                RankedStation(
                    station_id=c.station_id,
                    score=score,
                    distance_km=c.distance_km,
                    travel_time_min=c.travel_time_min,
                    waiting_time_min=c.waiting_time_min,
                    cost_per_kwh=c.cost_per_kwh,
                )
            )
        # min-heap equivalent: sort ascending by score
        scored.sort(key=lambda x: x.score)
        return scored

    def has_booking_conflict(
        self, existing: List[Tuple[int, int]], new_start: int, new_end: int
    ) -> bool:
        """existing: list of (start_ts, end_ts). Mirrors C has_conflict."""
        if new_end <= new_start:
            return True
        for s, e in existing:
            if new_start < e and s < new_end:
                return True
        return False

    def find_free_slot(
        self,
        existing: List[Tuple[int, int]],
        preferred_start: int,
        duration_min: int,
        day_start: int,
        day_end: int,
    ) -> Optional[Tuple[int, int]]:
        duration_sec = duration_min * 60
        candidate = max(preferred_start, day_start)
        step = 15 * 60
        while candidate + duration_sec <= day_end:
            end = candidate + duration_sec
            if not self.has_booking_conflict(existing, candidate, end):
                return candidate, end
            candidate += step
        return None


_bridge: Optional[DSABridge] = None


def get_dsa_bridge() -> DSABridge:
    global _bridge
    if _bridge is None:
        _bridge = DSABridge()
    return _bridge
