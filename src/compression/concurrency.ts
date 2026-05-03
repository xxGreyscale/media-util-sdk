/**
 * Limits the number of concurrently running async tasks.
 * Tasks exceeding the limit are queued and run as slots free up.
 */
export class ConcurrencyLimiter {
  private readonly maxConcurrent: number;
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(maxConcurrent: number) {
    this.maxConcurrent = Math.max(1, maxConcurrent);
  }

  /**
   * Runs a task, waiting if the concurrency limit is reached.
   */
  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  private release(): void {
    const next = this.queue.shift();
    if (next) {
      // Transfer the slot directly to the next waiter.
      next();
    } else {
      this.running--;
    }
  }
}
