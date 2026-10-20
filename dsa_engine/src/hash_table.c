#include <stdlib.h>
#include <string.h>

#define HASH_SIZE 256

typedef struct HashEntry {
    int key;
    int value;   /* e.g. station index */
    struct HashEntry *next;
} HashEntry;

typedef struct {
    HashEntry *buckets[HASH_SIZE];
} HashTable;

static unsigned int hash(int key) {
    return (unsigned int)key % HASH_SIZE;
}

void hash_init(HashTable *ht) {
    if (!ht) return;
    memset(ht->buckets, 0, sizeof(ht->buckets));
}

int hash_put(HashTable *ht, int key, int value) {
    if (!ht) return -1;
    unsigned int h = hash(key);
    HashEntry *e = ht->buckets[h];
    while (e) {
        if (e->key == key) {
            e->value = value;
            return 0;
        }
        e = e->next;
    }
    HashEntry *ne = (HashEntry *)malloc(sizeof(HashEntry));
    if (!ne) return -1;
    ne->key = key;
    ne->value = value;
    ne->next = ht->buckets[h];
    ht->buckets[h] = ne;
    return 0;
}

int hash_get(const HashTable *ht, int key, int *out_value) {
    if (!ht || !out_value) return -1;
    unsigned int h = hash(key);
    HashEntry *e = ht->buckets[h];
    while (e) {
        if (e->key == key) {
            *out_value = e->value;
            return 0;
        }
        e = e->next;
    }
    return -1;
}

void hash_free(HashTable *ht) {
    if (!ht) return;
    for (int i = 0; i < HASH_SIZE; i++) {
        HashEntry *e = ht->buckets[i];
        while (e) {
            HashEntry *n = e->next;
            free(e);
            e = n;
        }
        ht->buckets[i] = NULL;
    }
}
