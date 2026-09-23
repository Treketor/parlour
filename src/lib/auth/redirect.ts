const BASE = "http://parlour.invalid";

/**
 * Where to send someone after signing in. The value arrives in a URL anyone
 * can craft, so only same-site paths are allowed; anything else, including
 * protocol-relative and backslash tricks, falls back.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/")) return fallback;

  try {
    // The URL parser normalises what browsers would (tabs, backslashes), so
    // checking the parsed origin catches encodings a string check would miss.
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
