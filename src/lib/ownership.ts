/** Whether I have a game on a given platform. Independent of progress. */
export const OWNERSHIP_STATES = ["owned", "want_to_own", "not_interested"] as const;

export type Ownership = (typeof OWNERSHIP_STATES)[number];

export const ownershipLabel: Record<Ownership, string> = {
  owned: "Owned",
  want_to_own: "Want to own",
  not_interested: "Not interested",
};
