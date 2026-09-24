/*
 * Small preferences the server needs on the first render (which layout to
 * draw, which search to show), so they live in cookies rather than browser
 * storage: nothing flashes from the default to the choice.
 */

const ONE_YEAR_S = 60 * 60 * 24 * 365;

/** Sets a preference from the browser; an empty value forgets it. */
export function setPreferenceCookie(name: string, value: string): void {
  const age = value === "" ? 0 : ONE_YEAR_S;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${age}; samesite=lax`;
}

/** Reads a preference cookie's value on the server, undoing the browser-side encoding. */
export function decodePreference(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}
