// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import type { ExternalScore } from "@/lib/external-scores";
import { ScoreSourceError } from "./providers";
import { SCORE_CHECK_MS, createScoreService, type ScoreGame, type ScoreStore } from "./service";

const NOW = Date.UTC(2026, 8, 24);

const metacritic: ExternalScore = {
  source: "metacritic",
  score: 99,
  outOf: 100,
  count: null,
  label: null,
  url: null,
};
const steam: ExternalScore = {
  source: "steam",
  score: 95,
  outOf: 100,
  count: 5000,
  label: "Overwhelmingly Positive",
  url: null,
};

const game: ScoreGame = {
  id: 1,
  name: "Game",
  slug: "game",
  firstReleaseDate: "2020-01-01",
  steamAppIds: ["10"],
};

function memoryStore(scores: ExternalScore[] = [], checkedAt: Date | null = null) {
  const state = { scores, checkedAt };
  const store = {
    state,
    read: vi.fn(async () => ({ scores: state.scores, checkedAt: state.checkedAt })),
    write: vi.fn(async (_id: number, next: ExternalScore[], checked: boolean) => {
      if (!checked) return;
      state.scores = next;
      state.checkedAt = new Date(NOW);
    }),
  } satisfies ScoreStore & { state: typeof state };
  return store;
}

describe("scoresFor", () => {
  it("serves stored scores checked within the week without asking anyone", async () => {
    const store = memoryStore([metacritic], new Date(NOW - SCORE_CHECK_MS + 1000));
    const rawg = vi.fn();
    const service = createScoreService({
      store,
      sources: { rawg, steam: vi.fn() },
      now: () => NOW,
    });
    expect(await service.scoresFor(game)).toEqual([metacritic]);
    expect(rawg).not.toHaveBeenCalled();
  });

  it("looks up every source when due and records the check", async () => {
    const store = memoryStore();
    const service = createScoreService({
      store,
      sources: { rawg: async () => [metacritic], steam: async () => steam },
      now: () => NOW,
    });
    expect(await service.scoresFor(game)).toEqual([steam, metacritic]);
    expect(store.write).toHaveBeenCalledWith(1, [steam, metacritic], true);
  });

  it("keeps a failing source's last scores and leaves the game due", async () => {
    const store = memoryStore([metacritic, steam], new Date(NOW - SCORE_CHECK_MS * 2));
    const service = createScoreService({
      store,
      sources: {
        rawg: async () => {
          throw new ScoreSourceError("RAWG", new Error("503"));
        },
        steam: async () => ({ ...steam, score: 96 }),
      },
      now: () => NOW,
    });
    const scores = await service.scoresFor(game);
    expect(scores).toContainEqual(metacritic);
    expect(scores).toContainEqual({ ...steam, score: 96 });
    expect(store.write).toHaveBeenCalledWith(1, expect.any(Array), false);
  });

  it("skips Steam for a game that is not on Steam, and RAWG without a key", async () => {
    const steamSource = vi.fn();
    const service = createScoreService({
      store: memoryStore(),
      sources: { rawg: null, steam: steamSource },
      now: () => NOW,
    });
    expect(await service.scoresFor({ ...game, steamAppIds: [] })).toEqual([]);
    expect(steamSource).not.toHaveBeenCalled();
  });

  it("takes the Steam app with the most reviews when IGDB lists several", async () => {
    const service = createScoreService({
      store: memoryStore(),
      sources: {
        rawg: null,
        steam: async (appId) =>
          appId === "49520"
            ? { ...steam, count: 312_542 }
            : appId === "379880"
              ? null
              : { ...steam, count: 40 },
      },
      now: () => NOW,
    });
    const scores = await service.scoresFor({ ...game, steamAppIds: ["379880", "1", "49520"] });
    expect(scores).toEqual([{ ...steam, count: 312_542 }]);
  });

  it("lets an unexpected error through rather than hiding a bug", async () => {
    const service = createScoreService({
      store: memoryStore(),
      sources: {
        rawg: async () => {
          throw new TypeError("bug");
        },
        steam: async () => null,
      },
      now: () => NOW,
    });
    await expect(service.scoresFor(game)).rejects.toBeInstanceOf(TypeError);
  });
});
