/*
 * Where I am with a game. Exactly one per library entry; anything that can be
 * true at the same time (e.g. "want to complete") is a tag. See DECISIONS.md 004.
 */

export const PROGRESS_STATES = [
  "want_to_play",
  "playing",
  "paused",
  "finished",
  "completed",
  "abandoned",
] as const;

export type Progress = (typeof PROGRESS_STATES)[number];

export const progressLabel: Record<Progress, string> = {
  want_to_play: "Want to play",
  playing: "Playing",
  paused: "Paused",
  finished: "Finished",
  completed: "Completed",
  abandoned: "Abandoned",
};

/** One-line explanations, used where the distinction is not obvious from the name. */
export const progressDescription: Record<Progress, string> = {
  want_to_play: "Not started yet",
  playing: "In progress now",
  paused: "Started, set aside for now",
  finished: "Reached the credits",
  completed: "Done everything worth doing",
  abandoned: "Stopped, not coming back",
};
