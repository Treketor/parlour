/**
 * Where to send a sign-in code that arrived on the wrong page, or null if
 * this request carries none.
 *
 * Supabase sends a link back to the address the app asked for only when that
 * address is on the project's redirect list. Otherwise it falls back to the
 * Site URL, the home page, where nothing finishes sign-in, and the visitor
 * silently stays signed out. Forwarding the code to the confirm page makes
 * sign-in work either way.
 */
export function strayCodeRedirect(url: URL): URL | null {
  const code = url.searchParams.get("code");
  if (!code || url.pathname === "/auth/confirm") return null;

  const target = new URL("/auth/confirm", url);
  target.searchParams.set("code", code);
  const rest = new URLSearchParams(url.searchParams);
  rest.delete("code");
  const query = rest.toString();
  target.searchParams.set("next", `${url.pathname}${query ? `?${query}` : ""}`);
  return target;
}
