const dayMonthYear = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** "4 Mar 2026". Day-first with a named month is unambiguous in every region. */
export function formatDate(date: Date): string {
  return dayMonthYear.format(date);
}
