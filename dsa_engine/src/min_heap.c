#include "min_heap.h"

static void swap(HeapItem *a, HeapItem *b) {
    HeapItem t = *a;
    *a = *b;
    *b = t;
}

void heap_init(MinHeap *h) {
    if (h) h->size = 0;
}

void heap_push(MinHeap *h, int id, double score) {
    if (!h || h->size >= HEAP_MAX) return;
    int i = h->size++;
    h->items[i].id = id;
    h->items[i].score = score;
    /* bubble up */
    while (i > 0) {
        int parent = (i - 1) / 2;
        if (h->items[parent].score <= h->items[i].score) break;
        swap(&h->items[parent], &h->items[i]);
        i = parent;
    }
}

int heap_pop(MinHeap *h, HeapItem *out) {
    if (!h || h->size == 0 || !out) return -1;
    *out = h->items[0];
    h->items[0] = h->items[--h->size];
    /* bubble down */
    int i = 0;
    while (1) {
        int left = 2 * i + 1;
        int right = 2 * i + 2;
        int smallest = i;
        if (left < h->size && h->items[left].score < h->items[smallest].score)
            smallest = left;
        if (right < h->size && h->items[right].score < h->items[smallest].score)
            smallest = right;
        if (smallest == i) break;
        swap(&h->items[i], &h->items[smallest]);
        i = smallest;
    }
    return 0;
}

int heap_empty(const MinHeap *h) {
    return !h || h->size == 0;
}

int heap_size(const MinHeap *h) {
    return h ? h->size : 0;
}
