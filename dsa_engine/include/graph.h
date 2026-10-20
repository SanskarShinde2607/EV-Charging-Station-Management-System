#ifndef GRAPH_H
#define GRAPH_H

#define MAX_NODES 256
#define MAX_EDGES_PER_NODE 32

typedef struct {
    int to;
    double weight;  /* distance in km or time */
} Edge;

typedef struct {
    int node_id;
    Edge edges[MAX_EDGES_PER_NODE];
    int edge_count;
    double lat;
    double lon;
} Node;

typedef struct {
    Node nodes[MAX_NODES];
    int node_count;
} Graph;

void graph_init(Graph *g);
int  graph_add_node(Graph *g, int id, double lat, double lon);
int  graph_add_edge(Graph *g, int from, int to, double weight);
int  graph_find_node(const Graph *g, int id);

#endif
