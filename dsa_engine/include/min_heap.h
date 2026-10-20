#ifndef MIN_HEAP_H
#define MIN_HEAP_H

#define HEAP_MAX 512

typedef struct {
    int id;          /* station or node id */
    double score;    /* lower is better */
} HeapItem;

typedef struct {
    HeapItem items[HEAP_MAX];
    int size;
} MinHeap;

void heap_init(MinHeap *h);
void heap_push(MinHeap *h, int id, double score);
int  heap_pop(MinHeap *h, HeapItem *out);
int  heap_empty(const MinHeap *h);
int  heap_size(const MinHeap *h);

#endif
