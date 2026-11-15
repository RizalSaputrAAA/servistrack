// MinHeap generik (untuk benchmark antrean prioritas).
// Prioritas tinggi lebih dulu; jika sama, yang lebih lama masuk lebih dulu.
export type QItem = { priority: number; createdAt: number; data?: any };

const before = (a: QItem, b: QItem) =>
  a.priority !== b.priority ? a.priority > b.priority : a.createdAt < b.createdAt;

export class PriorityQueue {
  private h: QItem[] = [];
  get size() { return this.h.length; }
  push(x: QItem) {
    this.h.push(x);
    let i = this.h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!before(this.h[i], this.h[p])) break;
      [this.h[i], this.h[p]] = [this.h[p], this.h[i]];
      i = p;
    }
  }
  pop(): QItem | undefined {
    if (!this.h.length) return undefined;
    const top = this.h[0];
    const last = this.h.pop()!;
    if (this.h.length) {
      this.h[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < this.h.length && before(this.h[l], this.h[m])) m = l;
        if (r < this.h.length && before(this.h[r], this.h[m])) m = r;
        if (m === i) break;
        [this.h[i], this.h[m]] = [this.h[m], this.h[i]];
        i = m;
      }
    }
    return top;
  }
}
