/*
 * Fixed three-letter months rather than Intl: ICU data varies between
 * runtimes ("Sep" in one, "Sept" in another), which would make server and
 * client render different text and break column alignment.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "4 Mar 2026". Day-first with a named month reads the same in every region. Uses UTC. */
export function formatDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
