"""Unit tests for DSA bridge (pure-Python path)."""
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.dsa_bridge.bridge import DSABridge, StationCandidate


def test_haversine():
    b = DSABridge()
    d = b.haversine_km(12.97, 77.59, 12.98, 77.60)
    assert 0.5 < d < 3.0


def test_rank_stations():
    b = DSABridge()
    cands = [
        StationCandidate(1, 2.0, 10.0, 5.0, 12.0, 2, 1),
        StationCandidate(2, 5.0, 20.0, 0.0, 10.0, 1, 1),
        StationCandidate(3, 1.0, 5.0, 15.0, 15.0, 0, 1),  # no chargers
    ]
    ranked = b.rank_stations(cands)
    assert len(ranked) == 2
    assert ranked[0].score <= ranked[1].score


def test_conflict():
    b = DSABridge()
    existing = [(1000, 2000), (3000, 4000)]
    assert b.has_booking_conflict(existing, 1500, 2500) is True
    assert b.has_booking_conflict(existing, 2100, 2900) is False


def test_free_slot():
    b = DSABridge()
    existing = [(1000, 2000), (3000, 4000)]
    slot = b.find_free_slot(existing, 900, 20, 0, 10000)
    assert slot is not None
    start, end = slot
    assert end - start == 20 * 60
