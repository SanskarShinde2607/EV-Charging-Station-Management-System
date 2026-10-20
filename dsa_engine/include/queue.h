#ifndef QUEUE_H
#define QUEUE_H

#define QUEUE_MAX 256

typedef struct {
    int vehicle_id;
    int station_id;
    int charger_id;
    long preferred_start;  /* unix timestamp */
    int duration_min;
} QueueItem;

typedef struct {
    QueueItem items[QUEUE_MAX];
    int front;
    int rear;
    int count;
} WaitingQueue;

void queue_init(WaitingQueue *q);
int  queue_enqueue(WaitingQueue *q, QueueItem item);
int  queue_dequeue(WaitingQueue *q, QueueItem *out);
int  queue_peek(const WaitingQueue *q, QueueItem *out);
int  queue_is_empty(const WaitingQueue *q);
int  queue_size(const WaitingQueue *q);

#endif
