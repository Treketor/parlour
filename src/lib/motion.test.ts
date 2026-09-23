// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { duration, easing } from "./motion";

const css = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8");

// Only the first :root block holds the defaults; later blocks are overrides.
const rootBlock = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")));

function readToken(name: string): string {
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(rootBlock);
  if (!match?.[1]) throw new Error(`Token --${name} not found in tokens.css`);
  return match[1].trim();
}

describe("motion tokens", () => {
  it.each([
    ["ease-out", easing.out],
    ["ease-in-out", easing.inOut],
    ["ease-in", easing.in],
  ] as const)("--%s matches the JS easing curve", (name, curve) => {
    expect(readToken(name)).toBe(`cubic-bezier(${curve.join(", ")})`);
  });

  it.each(Object.entries(duration))("--duration-%s matches the JS duration", (name, ms) => {
    expect(readToken(`duration-${name}`)).toBe(`${ms}ms`);
  });
});
