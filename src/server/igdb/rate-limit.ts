/*
 * IGDB allows 4 requests per second and 8 in flight at once (docs, "Rate
 * Limits"). This keeps one server instance inside both. Several instances
 * could still exceed the rate together, which is why the client also backs
 * off on 429 rather than relying on this alone.
 */

export type RateLimiter = <T>(task: () => Promise<T>) => Promise<T>;

type LimiterOptions = {
  perSecond: number;
  maxInFlight: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

const WINDOW_MS = 1000;

export function createRateLimiter({
  perSecond,
  maxInFlight,
  now = Date.now,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}: LimiterOptions): RateLimiter {
  const starts: number[] = [];
  let inFlight = 0;
  // Woken when a task finishes, so waiting for a free slot costs nothing.
  const waitingForSlot: Array<() => void> = [];
  // Tasks take their turn in order, so an early caller is never starved by later ones.
  let queue: Promise<void> = Promise.resolve();

  async function acquire() {
    for (;;) {
      if (inFlight >= maxInFlight) {
        await new Promise<void>((resolve) => waitingForSlot.push(resolve));
        continue;
      }

      const current = now();
      while (starts.length > 0 && (starts[0] ?? 0) <= current - WINDOW_MS) starts.shift();

      const oldest = starts[0];
      if (starts.length >= perSecond && oldest !== undefined) {
        await sleep(oldest + WINDOW_MS - current);
        continue;
      }

      starts.push(current);
      inFlight += 1;
      return;
    }
  }

  function release() {
    inFlight -= 1;
    waitingForSlot.shift()?.();
  }

  return async function schedule<T>(task: () => Promise<T>): Promise<T> {
    const turn = queue.then(acquire);
    // The next caller queues behind this one getting a slot, not behind its whole run.
    queue = turn.catch(() => undefined);
    await turn;
    try {
      return await task();
    } finally {
      release();
    }
  };
}
