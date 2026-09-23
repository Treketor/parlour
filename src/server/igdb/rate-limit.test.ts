// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

/** A manual clock: sleep() advances time instead of waiting. */
function fakeClock() {
  let time = 0;
  return {
    now: () => time,
    sleep: async (ms: number) => {
      time += ms;
    },
  };
}

describe("createRateLimiter", () => {
  it("starts no more than the allowed number of tasks in any one second", async () => {
    const clock = fakeClock();
    const limit = createRateLimiter({ perSecond: 4, maxInFlight: 8, ...clock });
    const startedAt: number[] = [];

    await Promise.all(
      Array.from({ length: 10 }, () =>
        limit(async () => {
          startedAt.push(clock.now());
        }),
      ),
    );

    expect(startedAt).toHaveLength(10);
    for (const start of startedAt) {
      const inWindow = startedAt.filter((other) => other >= start && other < start + 1000);
      expect(inWindow.length).toBeLessThanOrEqual(4);
    }
    // Ten tasks at four per second need at least two full seconds of waiting.
    expect(Math.max(...startedAt)).toBeGreaterThanOrEqual(2000);
  });

  it("never has more than the allowed number in flight", async () => {
    const clock = fakeClock();
    const limit = createRateLimiter({ perSecond: 100, maxInFlight: 2, ...clock });
    let running = 0;
    let peak = 0;

    await Promise.all(
      Array.from({ length: 6 }, () =>
        limit(async () => {
          running += 1;
          peak = Math.max(peak, running);
          await new Promise((resolve) => setTimeout(resolve, 1));
          running -= 1;
        }),
      ),
    );

    expect(peak).toBe(2);
  });

  it("frees the slot when a task fails", async () => {
    const clock = fakeClock();
    const limit = createRateLimiter({ perSecond: 10, maxInFlight: 1, ...clock });

    await expect(limit(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(limit(async () => "next")).resolves.toBe("next");
  });

  it("runs tasks in the order they were scheduled", async () => {
    const clock = fakeClock();
    const limit = createRateLimiter({ perSecond: 1, maxInFlight: 1, ...clock });
    const order: number[] = [];

    await Promise.all([1, 2, 3].map((n) => limit(async () => order.push(n))));

    expect(order).toEqual([1, 2, 3]);
  });
});
