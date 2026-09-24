// @vitest-environment node
import { describe, expect, it } from "vitest";
import { compareKeys, keyBetween, keyFor, withQueued, withoutQueued } from "./queue-order";

describe("keyFor", () => {
  it("starts an empty queue and appends after the last", () => {
    const first = keyFor("last", { first: null, last: null });
    const second = keyFor("last", { first, last: first });
    expect(compareKeys(first, second)).toBe(-1);
  });

  it("puts a game played next before the first", () => {
    const first = keyFor("last", { first: null, last: null });
    const next = keyFor("next", { first, last: first });
    expect(compareKeys(next, first)).toBe(-1);
  });
});

describe("keyBetween", () => {
  it("lands strictly between two neighbours, however often it is used", () => {
    let low = keyFor("last", { first: null, last: null });
    const high = keyFor("last", { first: low, last: low });
    for (let step = 0; step < 50; step++) {
      const middle = keyBetween(low, high);
      expect(middle).not.toBeNull();
      expect(compareKeys(low, middle as string)).toBe(-1);
      expect(compareKeys(middle as string, high)).toBe(-1);
      low = middle as string;
    }
  });

  it("handles the ends of the queue", () => {
    const only = keyFor("last", { first: null, last: null });
    expect(compareKeys(keyBetween(null, only) as string, only)).toBe(-1);
    expect(compareKeys(only, keyBetween(only, null) as string)).toBe(-1);
  });

  it("refuses neighbours that are out of order", () => {
    expect(keyBetween("a2", "a1")).toBeNull();
    expect(keyBetween("a1", "a1")).toBeNull();
  });

  it("uses only characters that sort alike in JavaScript and Postgres", () => {
    const keys = Array.from({ length: 20 }, (_, index) => index).reduce<string[]>(
      (list) => [...list, keyFor("last", { first: list[0] ?? null, last: list.at(-1) ?? null })],
      [],
    );
    for (const key of keys) expect(key).toMatch(/^[0-9A-Za-z]+$/);
  });
});

describe("queue positions", () => {
  const queue = { a: 1, b: 2, c: 3 };

  it("appends at the back or moves everyone down for play next", () => {
    expect(withQueued(queue, "d", "last")).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    expect(withQueued(queue, "d", "next")).toEqual({ d: 1, a: 2, b: 3, c: 4 });
  });

  it("leaves an entry already queued where it is", () => {
    expect(withQueued(queue, "b", "next")).toBe(queue);
  });

  it("closes the gap when an entry leaves", () => {
    expect(withoutQueued(queue, "a")).toEqual({ b: 1, c: 2 });
    expect(withoutQueued(queue, "c")).toEqual({ a: 1, b: 2 });
    expect(withoutQueued(queue, "z")).toBe(queue);
  });
});
