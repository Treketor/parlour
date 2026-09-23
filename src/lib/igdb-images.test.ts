// @vitest-environment node
import { describe, expect, it } from "vitest";
import { igdbImageUrl } from "./igdb-images";

describe("igdbImageUrl", () => {
  it("builds the documented URL shape", () => {
    expect(igdbImageUrl("co2e3r", "cover_big")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co2e3r.jpg",
    );
  });

  it("adds the double-density suffix for sharp screens", () => {
    expect(igdbImageUrl("co2e3r", "cover_small", true)).toContain("/t_cover_small_2x/");
  });

  it("encodes the id so it cannot change the path", () => {
    expect(igdbImageUrl("../x", "cover_big")).toContain("/..%2Fx.jpg");
  });
});
