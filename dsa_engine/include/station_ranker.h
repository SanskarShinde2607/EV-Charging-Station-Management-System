#ifndef STATION_RANKER_H
#define STATION_RANKER_H

#include "min_heap.h"

#define MAX_CANDIDATES 128

typedef struct {
    int station_id;
    double distance_km;
    double travel_time_min;
    double waiting_time_min;
    double cost_per_kwh;
    int available_chargers;
    int compatible;   /* 1 if connector matches */
} StationCandidate;

typedef struct {
    double w_distance;
    double w_time;
    double w_wait;
    double w_cost;
} RankWeights;

typedef struct {
    int station_id;
    double score;
    double distance_km;
    double travel_time_min;
    double waiting_time_min;
    double cost_per_kwh;
} RankedStation;

/* Rank stations: lower score is better. Only compatible & available are ranked. */
int rank_stations(const StationCandidate *cands, int n,
                  const RankWeights *weights,
                  RankedStation *out, int max_out);

#endif
