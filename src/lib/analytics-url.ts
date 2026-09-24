/*
 * Query parameters that are safe to report: they describe how a page was
 * viewed, not who viewed it. Everything else is dropped before a page view or
 * vital reaches Vercel, including sign-in codes and tokens, and entry ids,
 * which point at one person's library.
 */
const REPORTED_PARAMS = new Set(["q", "view", "sort", "dir", "cols"]);

export function redactUrl(url: string): string {
  const parsed = new URL(url);
  for (const key of [...parsed.searchParams.keys()]) {
    if (!REPORTED_PARAMS.has(key)) parsed.searchParams.delete(key);
  }
  parsed.hash = "";
  return parsed.toString();
}
