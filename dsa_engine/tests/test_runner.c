#include <stdio.h>
#include <assert.h>
#include <math.h>
#include "graph.h"
#include "dijkstra.h"
#include "min_heap.h"
#include "queue.h"
#include "station_ranker.h"
#include "booking_intervals.h"

static void test_graph_dijkstra(void) {
    Graph g;
    graph_init(&g);
    graph_add_node(&g, 0, 12.97, 77.59);
    graph_add_node(&g, 1, 12.98, 77.60);
    graph_add_node(&g, 2, 12.99, 77.61);
    graph_add_edge(&g, 0, 1, 1.5);
    graph_add_edge(&g, 1, 2, 2.0);
    graph_add_edge(&g, 0, 2, 4.0);

    DijkstraResult res;
    int rc = dijkstra(&g, 0, 2, &res);
    assert(rc == 0);
    assert(fabs(res.total_dist - 3.5) < 1e-6); /* 0->1->2 */
    printf("  [PASS] graph + dijkstra\n");
}

static void test_min_heap(void) {
    MinHeap h;
    heap_init(&h);
    heap_push(&h, 10, 5.0);
    heap_push(&h, 20, 1.0);
    heap_push(&h, 30, 3.0);
    HeapItem item;
    assert(heap_pop(&h, &item) == 0 && item.id == 20);
    assert(heap_pop(&h, &item) == 0 && item.id == 30);
    assert(heap_pop(&h, &item) == 0 && item.id == 10);
    printf("  [PASS] min-heap\n");
}

static void test_queue(void) {
    WaitingQueue q;
    queue_init(&q);
    QueueItem it = {.vehicle_id = 1, .station_id = 5, .duration_min = 30};
    assert(queue_enqueue(&q, it) == 0);
    assert(queue_size(&q) == 1);
    QueueItem out;
    assert(queue_dequeue(&q, &out) == 0 && out.vehicle_id == 1);
    assert(queue_is_empty(&q));
    printf("  [PASS] waiting queue\n");
}

static void test_ranker(void) {
    StationCandidate cands[3] = {
        {1, 2.0, 10.0, 5.0, 12.0, 2, 1},
        {2, 5.0, 20.0, 0.0, 10.0, 1, 1},
        {3, 1.0, 5.0, 15.0, 15.0, 0, 1}, /* no chargers -> filtered */
    };
    RankWeights w = {0.3, 0.3, 0.2, 0.2};
    RankedStation ranked[3];
    int n = rank_stations(cands, 3, &w, ranked, 3);
    assert(n == 2);
    printf("  [PASS] station ranker (got %d stations)\n", n);
}

static void test_intervals(void) {
    Interval bookings[2] = {
        {1000, 2000, 1},
        {3000, 4000, 2},
    };
    assert(has_conflict(bookings, 2, 1500, 2500) == 1);
    assert(has_conflict(bookings, 2, 2100, 2900) == 0);
    long s, e;
    int rc = find_free_slot(bookings, 2, 900, 20, 0, 10000, &s, &e);
    assert(rc == 0);
    printf("  [PASS] booking intervals\n");
}

int main(void) {
    printf("DSA Engine unit tests\n");
    test_graph_dijkstra();
    test_min_heap();
    test_queue();
    test_ranker();
    test_intervals();
    printf("All tests passed.\n");
    return 0;
}
