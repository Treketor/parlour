// @vitest-environment node
import { describe, expect, it } from "vitest";
import { orderPlatforms, platformLabel } from "./platforms";

const pc = { id: 6, name: "PC (Microsoft Windows)", generation: null };
const mac = { id: 14, name: "Mac", generation: null };
const stadia = { id: 170, name: "Google Stadia", generation: null };
const ps5 = { id: 167, name: "PlayStation 5", generation: 9 };
const ps4 = { id: 48, name: "PlayStation 4", generation: 8 };
const switch1 = { id: 130, name: "Nintendo Switch", generation: 8 };
const ds = { id: 20, name: "Nintendo DS", generation: 7 };
const threeDs = { id: 37, name: "Nintendo 3DS", generation: 8 };
const ios = { id: 39, name: "iOS", generation: null };

const names = (list: Array<{ name: string }>) => list.map((platform) => platform.name);

describe("orderPlatforms", () => {
  it("starts Borderlands 3 on PC rather than Stadia", () => {
    expect(orderPlatforms([stadia, ps4, mac, pc])[0]).toBe(pc);
  });

  it("puts common current platforms ahead of older ones", () => {
    expect(names(orderPlatforms([ps4, switch1, ps5]))).toEqual([
      "PlayStation 5",
      "Nintendo Switch",
      "PlayStation 4",
    ]);
  });

  it("orders other platforms by generation, newest first", () => {
    expect(names(orderPlatforms([ds, threeDs]))).toEqual(["Nintendo 3DS", "Nintendo DS"]);
  });

  it("puts rarely owned ports last", () => {
    expect(names(orderPlatforms([ios, mac, ds]))).toEqual(["Nintendo DS", "Mac", "iOS"]);
  });

  it("prefers the platform you use most in your own library", () => {
    expect(orderPlatforms([pc, switch1, ps5], { 130: 12, 6: 3 })[0]).toBe(switch1);
  });

  it("ignores a platform with only one or two games on it", () => {
    // One stray Xbox 360 entry should not make every game open on Xbox 360.
    const x360 = { id: 12, name: "Xbox 360", generation: 7 };
    expect(orderPlatforms([x360, pc], { 12: 2 })[0]).toBe(pc);
  });

  it("does not change the input", () => {
    const list = [mac, pc];
    orderPlatforms(list);
    expect(list).toEqual([mac, pc]);
  });
});

describe("platformLabel", () => {
  it("shortens Windows to PC and leaves other names alone", () => {
    expect(platformLabel("PC (Microsoft Windows)")).toBe("PC");
    expect(platformLabel("Xbox Series X|S")).toBe("Xbox Series X|S");
  });
});
