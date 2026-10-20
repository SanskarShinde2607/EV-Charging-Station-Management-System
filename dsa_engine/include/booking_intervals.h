#ifndef BOOKING_INTERVALS_H
#define BOOKING_INTERVALS_H

#define MAX_BOOKINGS 512

typedef struct {
    long start;   /* unix timestamp */
    long end;
    int  booking_id;
} Interval;

/* Returns 1 if intervals [a_start,a_end) and [b_start,b_end) overlap */
int intervals_overlap(long a_start, long a_end, long b_start, long b_end);

/* Returns 1 if new interval conflicts with any existing booking */
int has_conflict(const Interval *bookings, int n,
                 long new_start, long new_end);

/* Find first free slot of duration_min starting at or after preferred_start */
int find_free_slot(const Interval *bookings, int n,
                   long preferred_start, int duration_min,
                   long day_start, long day_end,
                   long *out_start, long *out_end);

#endif
