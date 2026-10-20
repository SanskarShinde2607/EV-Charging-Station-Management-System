#include "queue.h"

void queue_init(WaitingQueue *q) {
    if (!q) return;
    q->front = 0;
    q->rear = -1;
    q->count = 0;
}

int queue_enqueue(WaitingQueue *q, QueueItem item) {
    if (!q || q->count >= QUEUE_MAX) return -1;
    q->rear = (q->rear + 1) % QUEUE_MAX;
    q->items[q->rear] = item;
    q->count++;
    return 0;
}

int queue_dequeue(WaitingQueue *q, QueueItem *out) {
    if (!q || q->count == 0 || !out) return -1;
    *out = q->items[q->front];
    q->front = (q->front + 1) % QUEUE_MAX;
    q->count--;
    return 0;
}

int queue_peek(const WaitingQueue *q, QueueItem *out) {
    if (!q || q->count == 0 || !out) return -1;
    *out = q->items[q->front];
    return 0;
}

int queue_is_empty(const WaitingQueue *q) {
    return !q || q->count == 0;
}

int queue_size(const WaitingQueue *q) {
    return q ? q->count : 0;
}
