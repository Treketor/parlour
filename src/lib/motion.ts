import type { Transition } from "motion/react";

/*
 * JS mirror of the motion tokens in src/styles/tokens.css, for Motion's API,
 * which cannot read CSS custom properties. motion.test.ts fails if they drift.
 */

type CubicBezier = readonly [number, number, number, number];

export const easing = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.55, 0, 1, 0.45],
} as const satisfies Record<string, CubicBezier>;

/** Milliseconds. */
export const duration = {
  press: 70,
  fast: 120,
  base: 180,
  slow: 240,
  spatial: 320,
} as const;

const seconds = (ms: number) => ms / 1000;

export const transition = {
  /** Something appearing in response to input: fast start, soft landing. */
  enter: { duration: seconds(duration.base), ease: [...easing.out] },
  /** Something leaving: gets out of the way quickly. */
  exit: { duration: seconds(duration.fast), ease: [...easing.in] },
  /** An element travelling to a new position, e.g. a reordered row. */
  move: { duration: seconds(duration.spatial), ease: [...easing.inOut] },
  /** A small indicator sliding between siblings, e.g. a segmented control. */
  slide: { duration: seconds(duration.slow), ease: [...easing.out] },
} as const satisfies Record<string, Transition>;

/*
 * Above this many visible items, layout animation on reorder costs more
 * frames than it is worth; lists crossfade instead. See DECISIONS.md 010.
 */
export const LAYOUT_ANIMATION_ITEM_LIMIT = 100;
