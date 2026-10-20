#include "dijkstra.h"
#include "min_heap.h"
#include <math.h>

int dijkstra(const Graph *g, int source, int target, DijkstraResult *result) {
    if (!g || !result || g->node_count == 0) return -1;

    int src_idx = graph_find_node(g, source);
    int tgt_idx = graph_find_node(g, target);
    if (src_idx < 0 || tgt_idx < 0) return -1;

    for (int i = 0; i < MAX_NODES; i++) {
        result->distances[i] = INF;
        result->previous[i] = -1;
    }
    result->path_len = 0;
    result->total_dist = INF;

    /* map node_id -> index for quick access */
    int id_to_idx[MAX_NODES];
    for (int i = 0; i < MAX_NODES; i++) id_to_idx[i] = -1;
    for (int i = 0; i < g->node_count; i++) {
        if (g->nodes[i].node_id >= 0 && g->nodes[i].node_id < MAX_NODES)
            id_to_idx[g->nodes[i].node_id] = i;
    }

    MinHeap heap;
    heap_init(&heap);

    result->distances[src_idx] = 0.0;
    heap_push(&heap, source, 0.0);

    while (!heap_empty(&heap)) {
        HeapItem cur;
        if (heap_pop(&heap, &cur) != 0) break;

        int u_id = cur.id;
        int u_idx = id_to_idx[u_id];
        if (u_idx < 0) continue;
        if (cur.score > result->distances[u_idx]) continue; /* stale */

        if (u_id == target) break;

        const Node *u = &g->nodes[u_idx];
        for (int e = 0; e < u->edge_count; e++) {
            int v_id = u->edges[e].to;
            int v_idx = id_to_idx[v_id];
            if (v_idx < 0) continue;
            double alt = result->distances[u_idx] + u->edges[e].weight;
            if (alt < result->distances[v_idx]) {
                result->distances[v_idx] = alt;
                result->previous[v_idx] = u_id;
                heap_push(&heap, v_id, alt);
            }
        }
    }

    if (result->distances[tgt_idx] >= INF) return -1; /* unreachable */

    result->total_dist = result->distances[tgt_idx];

    /* reconstruct path (reverse) */
    int path_rev[MAX_NODES];
    int len = 0;
    int cur = target;
    while (cur != -1 && len < MAX_NODES) {
        path_rev[len++] = cur;
        int cidx = id_to_idx[cur];
        if (cidx < 0) break;
        cur = result->previous[cidx];
        if (cur == source) {
            path_rev[len++] = source;
            break;
        }
    }
    /* reverse into result->path */
    result->path_len = len;
    for (int i = 0; i < len; i++) {
        result->path[i] = path_rev[len - 1 - i];
    }
    return 0;
}
