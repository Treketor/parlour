// @vitest-environment node
import { describe, expect, it } from "vitest";
import { igdbCoverSrcSet, igdbImageUrl } from "./igdb-images";

describe("igdbImageUrl", () => {
  it("builds the documented URL shape", () => {
    expect(igdbImageUrl("co2e3r", "cover_big")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co2e3r.webp",
    );
  });

  it("adds the double-density suffix for sharp screens", () => {
    expect(igdbImageUrl("co2e3r", "cover_small", true)).toContain("/t_cover_small_2x/");
  });

  it("encodes the id so it cannot change the path", () => {
    expect(igdbImageUrl("../x", "cover_big")).toContain("/..%2Fx.webp");
  });
});

describe("igdbCoverSrcSet", () => {
  it("offers the single and double density covers by width", () => {
    expect(igdbCoverSrcSet("co2e3r", "cover_small")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_small/co2e3r.webp 90w, " +
        "https://images.igdb.com/igdb/image/upload/t_cover_small_2x/co2e3r.webp 180w",
    );
  });
});
