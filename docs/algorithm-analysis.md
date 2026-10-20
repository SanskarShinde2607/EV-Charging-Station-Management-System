# Algorithm Analysis

## Station ranking

\[
Score(s) = w_d D(s) + w_t T(s) + w_w W(s) + w_c C(s)
\]

Each factor is min-max normalized over the candidate set to \([0,1]\).  
Lower score = better station.  
Connector compatibility and `available_chargers > 0` are hard filters (not weighted).

Default weights: \(w_d=0.35,\ w_t=0.30,\ w_w=0.15,\ w_c=0.20\).

**Complexity:** \(O(n)\) normalize + \(O(n \log n)\) heap insert/extract for \(n\) candidates.

## Dijkstra (route distance)

Binary min-heap Dijkstra on adjacency-list graph.

- Time: \(O((V+E)\log V)\)
- Space: \(O(V)\)

Used when a road network model is supplied; for the demo, haversine distance is used as a proxy and can be replaced by Dijkstra results.

## Booking conflict detection

Half-open intervals \([start, end)\).  
Overlap iff \(a.start < b.end \land b.start < a.end\).

Free-slot search walks 15-minute candidates from preferred start until day end.

- Conflict check: \(O(k)\) for \(k\) existing bookings on the charger
- Free slot: \(O(k \cdot m)\) where \(m\) is number of candidate slots

## Min-heap

Array-based binary heap. Push/pop \(O(\log n)\).

## Waiting queue

Circular array queue. Enqueue/dequeue \(O(1)\).
