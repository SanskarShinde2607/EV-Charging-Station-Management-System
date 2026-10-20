#include "booking_intervals.h"

int intervals_overlap(long a_start, long a_end, long b_start, long b_end) {
    /* half-open [start, end) */
    return a_start < b_end && b_start < a_end;
}

int has_conflict(const Interval *bookings, int n,
                 long new_start, long new_end) {
    if (!bookings || n <= 0) return 0;
    if (new_end <= new_start) return 1; /* invalid */
    for (int i = 0; i < n; i++) {
        if (intervals_overlap(bookings[i].start, bookings[i].end,
                              new_start, new_end))
            return 1;
    }
    return 0;
}

int find_free_slot(const Interval *bookings, int n,
                   long preferred_start, int duration_min,
                   long day_start, long day_end,
                   long *out_start, long *out_end) {
    if (!out_start || !out_end || duration_min <= 0) return -1;
    long duration_sec = (long)duration_min * 60;
    long candidate = preferred_start;
    if (candidate < day_start) candidate = day_start;

    /* simple scan: try every 15-min slot until day_end */
    const long step = 15 * 60;
    while (candidate + duration_sec <= day_end) {
        long end = candidate + duration_sec;
        if (!has_conflict(bookings, n, candidate, end)) {
            *out_start = candidate;
            *out_end = end;
            return 0;
        }
        candidate += step;
    }
    return -1; /* no free slot */
}
