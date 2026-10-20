#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include "graph.h"

#define INF 1e18

typedef struct {
    int node_id;
    double dist;
    int prev;
} PathNode;

typedef struct {
    double distances[MAX_NODES];
    int previous[MAX_NODES];
    int path[MAX_NODES];
    int path_len;
    double total_dist;
} DijkstraResult;

int dijkstra(const Graph *g, int source, int target, DijkstraResult *result);

#endif
