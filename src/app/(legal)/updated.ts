/*
 * When each page's text last changed. Update the date whenever the wording
 * changes, including when a new stage starts storing something new.
 */
export const LEGAL_UPDATED = {
  terms: new Date("2026-09-23"),
  privacy: new Date("2026-09-24"),
  dataSources: new Date("2026-09-24"),
} as const;
