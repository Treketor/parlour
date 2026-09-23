export type NavItem = { href: string; label: string };

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/", label: "Library" },
  { href: "/queue", label: "Queue" },
  { href: "/search", label: "Search" },
];

/**
 * Whether a nav item should show as current. The root only matches itself,
 * otherwise every page would light up Library; other items also match their
 * sub-pages, so a future /queue/edit still highlights Queue.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
