#include "station_ranker.h"
#include "min_heap.h"
#include <math.h>

/* Normalize value into [0,1] given min/max of the set. If range==0 return 0. */
static double normalize(double val, double min_v, double max_v) {
    if (max_v <= min_v) return 0.0;
    double n = (val - min_v) / (max_v - min_v);
    if (n < 0.0) n = 0.0;
    if (n > 1.0) n = 1.0;
    return n;
}

int rank_stations(const StationCandidate *cands, int n,
                  const RankWeights *weights,
                  RankedStation *out, int max_out) {
    if (!cands || !weights || !out || n <= 0 || max_out <= 0) return 0;

    /* collect eligible only */
    StationCandidate eligible[MAX_CANDIDATES];
    int m = 0;
    for (int i = 0; i < n && m < MAX_CANDIDATES; i++) {
        if (cands[i].compatible && cands[i].available_chargers > 0) {
            eligible[m++] = cands[i];
        }
    }
    if (m == 0) return 0;

    /* find min/max for normalization */
    double min_d = eligible[0].distance_km, max_d = min_d;
    double min_t = eligible[0].travel_time_min, max_t = min_t;
    double min_w = eligible[0].waiting_time_min, max_w = min_w;
    double min_c = eligible[0].cost_per_kwh, max_c = min_c;
    for (int i = 1; i < m; i++) {
        if (eligible[i].distance_km < min_d) min_d = eligible[i].distance_km;
        if (eligible[i].distance_km > max_d) max_d = eligible[i].distance_km;
        if (eligible[i].travel_time_min < min_t) min_t = eligible[i].travel_time_min;
        if (eligible[i].travel_time_min > max_t) max_t = eligible[i].travel_time_min;
        if (eligible[i].waiting_time_min < min_w) min_w = eligible[i].waiting_time_min;
        if (eligible[i].waiting_time_min > max_w) max_w = eligible[i].waiting_time_min;
        if (eligible[i].cost_per_kwh < min_c) min_c = eligible[i].cost_per_kwh;
        if (eligible[i].cost_per_kwh > max_c) max_c = eligible[i].cost_per_kwh;
    }

    MinHeap heap;
    heap_init(&heap);

    for (int i = 0; i < m; i++) {
        double D = normalize(eligible[i].distance_km, min_d, max_d);
        double T = normalize(eligible[i].travel_time_min, min_t, max_t);
        double W = normalize(eligible[i].waiting_time_min, min_w, max_w);
        double C = normalize(eligible[i].cost_per_kwh, min_c, max_c);
        double score = weights->w_distance * D
                     + weights->w_time * T
                     + weights->w_wait * W
                     + weights->w_cost * C;
        heap_push(&heap, i, score); /* store index into eligible */
    }

    int count = 0;
    while (!heap_empty(&heap) && count < max_out) {
        HeapItem item;
        if (heap_pop(&heap, &item) != 0) break;
        int idx = item.id;
        out[count].station_id = eligible[idx].station_id;
        out[count].score = item.score;
        out[count].distance_km = eligible[idx].distance_km;
        out[count].travel_time_min = eligible[idx].travel_time_min;
        out[count].waiting_time_min = eligible[idx].waiting_time_min;
        out[count].cost_per_kwh = eligible[idx].cost_per_kwh;
        count++;
    }
    return count;
}
