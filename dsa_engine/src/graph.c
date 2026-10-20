#include "graph.h"
#include <string.h>

void graph_init(Graph *g) {
    if (!g) return;
    g->node_count = 0;
    memset(g->nodes, 0, sizeof(g->nodes));
}

int graph_find_node(const Graph *g, int id) {
    if (!g) return -1;
    for (int i = 0; i < g->node_count; i++) {
        if (g->nodes[i].node_id == id) return i;
    }
    return -1;
}

int graph_add_node(Graph *g, int id, double lat, double lon) {
    if (!g || g->node_count >= MAX_NODES) return -1;
    if (graph_find_node(g, id) >= 0) return -1; /* already exists */
    int idx = g->node_count++;
    g->nodes[idx].node_id = id;
    g->nodes[idx].lat = lat;
    g->nodes[idx].lon = lon;
    g->nodes[idx].edge_count = 0;
    return idx;
}

int graph_add_edge(Graph *g, int from, int to, double weight) {
    if (!g || weight < 0) return -1;
    int fi = graph_find_node(g, from);
    int ti = graph_find_node(g, to);
    if (fi < 0 || ti < 0) return -1;
    Node *n = &g->nodes[fi];
    if (n->edge_count >= MAX_EDGES_PER_NODE) return -1;
    n->edges[n->edge_count].to = to;
    n->edges[n->edge_count].weight = weight;
    n->edge_count++;
    return 0;
}
