// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { ScoreSourceError, fetchRawgScores, fetchSteamScore } from "./providers";

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const ocarina = {
  name: "The Legend of Zelda: Ocarina of Time",
  slug: "the-legend-of-zelda-ocarina-of-time",
  firstReleaseDate: "1998-11-21",
};

describe("fetchRawgScores", () => {
  it("searches precisely, then asks the match for its Metacritic page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        respond({
          results: [
            {
              id: 27,
              slug: "the-legend-of-zelda-ocarina-of-time",
              name: "The Legend of Zelda: Ocarina of Time",
              released: "1998-11-21",
              metacritic: 99,
              rating: 4.5,
              ratings_count: 900,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        respond({
          metacritic_url: "https://www.metacritic.com/game/the-legend-of-zelda-ocarina-of-time/",
        }),
      );

    const scores = await fetchRawgScores(ocarina, "test-key", fetchMock);
    expect(scores.map((score) => [score.source, score.score])).toEqual([
      ["metacritic", 99],
      ["rawg", 4.5],
    ]);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("search_precise=true");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/api/games/27?key=test-key");
  });

  it("returns nothing, with one request, when no candidate matches", async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond({ results: [] }));
    expect(await fetchRawgScores(ocarina, "k", fetchMock)).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports a failed request or an unexpected shape as a source error", async () => {
    await expect(
      fetchRawgScores(ocarina, "k", vi.fn().mockResolvedValue(respond({}, 503))),
    ).rejects.toBeInstanceOf(ScoreSourceError);
    await expect(
      fetchRawgScores(ocarina, "k", vi.fn().mockResolvedValue(respond({ nope: true }))),
    ).rejects.toBeInstanceOf(ScoreSourceError);
  });
});

describe("fetchSteamScore", () => {
  it("reads the review summary", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respond({
        success: 1,
        query_summary: {
          review_score_desc: "Overwhelmingly Positive",
          total_positive: 980,
          total_reviews: 1000,
        },
      }),
    );
    const score = await fetchSteamScore("620", fetchMock);
    expect(score?.score).toBe(98);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://store.steampowered.com/appreviews/620?json=1&language=all&purchase_type=all&num_per_page=0",
    );
  });

  it("never requests an app id that is not a number", async () => {
    const fetchMock = vi.fn();
    expect(await fetchSteamScore("../620", fetchMock)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
