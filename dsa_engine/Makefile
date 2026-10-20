CC = gcc
CFLAGS = -Wall -Wextra -O2 -fPIC -Iinclude
LDFLAGS = -shared

SRCS = src/graph.c src/dijkstra.c src/min_heap.c src/queue.c \
       src/station_ranker.c src/booking_intervals.c src/merge_sort.c src/hash_table.c

OBJS = $(SRCS:.c=.o)
TARGET = libdsa_engine.so

.PHONY: all clean test

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(LDFLAGS) -o $@ $^ -lm

src/%.o: src/%.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET) tests/test_runner

# Simple unit test binary
test: $(OBJS) tests/test_runner.c
	$(CC) $(CFLAGS) -o tests/test_runner tests/test_runner.c $(OBJS) -lm
	./tests/test_runner
