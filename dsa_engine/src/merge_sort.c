#include <string.h>

/* Generic merge sort for integer arrays (used for sorting station ids by score etc.) */
static void merge(int *arr, int left, int mid, int right, int *tmp) {
    int i = left, j = mid + 1, k = left;
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) tmp[k++] = arr[i++];
        else tmp[k++] = arr[j++];
    }
    while (i <= mid) tmp[k++] = arr[i++];
    while (j <= right) tmp[k++] = arr[j++];
    for (i = left; i <= right; i++) arr[i] = tmp[i];
}

static void merge_sort_rec(int *arr, int left, int right, int *tmp) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    merge_sort_rec(arr, left, mid, tmp);
    merge_sort_rec(arr, mid + 1, right, tmp);
    merge(arr, left, mid, right, tmp);
}

void merge_sort(int *arr, int n) {
    if (!arr || n <= 1) return;
    int tmp[512];
    if (n > 512) return; /* safety */
    merge_sort_rec(arr, 0, n - 1, tmp);
}
