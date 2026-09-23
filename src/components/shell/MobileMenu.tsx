"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/app/auth/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PRIMARY_NAV, SECONDARY_NAV, isActivePath } from "@/lib/nav";
import { transition } from "@/lib/motion";
import { NavPendingSpinner } from "./NavPending";
import styles from "./MobileMenu.module.css";

/** Matches the header breakpoint where the inline nav takes over. */
const WIDE_QUERY = "(min-width: 40rem)";

/**
 * Narrow-screen navigation. The button's two strokes turn into a cross and its
 * word changes, so it always says what pressing it will do. The panel drops
 * from the header it belongs to and covers the page; the page behind is inert
 * and does not scroll while it is open.
 */
export function MobileMenu({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // When the new page arrives the menu vanishes at once: the page's own
  // entrance is the transition, and a second fade on top reads as lag.
  // Closing by hand (button, Escape) still animates.
  const [closeInstantly, setCloseInstantly] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setCloseInstantly(true);
    setOpen(false);
  }

  function toggle() {
    setCloseInstantly(false);
    setOpen((current) => !current);
  }

  // The panel stays up while a new page loads, so the old page never shows
  // through; only a tap on the page you are already on closes it here.
  function closeIfCurrent(href: string) {
    if (href === pathname) {
      setCloseInstantly(false);
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const page = [document.getElementById("content"), document.getElementById("site-footer")];
    page.forEach((element) => element?.setAttribute("inert", ""));
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    panelRef.current?.querySelector("a")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setCloseInstantly(false);
      setOpen(false);
      buttonRef.current?.focus();
    }

    // Rotating a tablet to landscape swaps in the inline nav; do not leave a hidden panel open.
    const wide = window.matchMedia(WIDE_QUERY);
    function onWide(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    wide.addEventListener("change", onWide);
    return () => {
      page.forEach((element) => element?.removeAttribute("inert"));
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        data-open={open || undefined}
        onClick={toggle}
      >
        <span className={styles.toggleLabel}>{open ? "Close" : "Menu"}</span>
        <svg className={styles.glyph} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <line className={styles.strokeTop} x1="2" y1="5.5" x2="14" y2="5.5" />
          <line className={styles.strokeBottom} x1="2" y1="10.5" x2="14" y2="10.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={panelId}
            className={styles.panel}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: transition.enter }}
            exit={
              closeInstantly
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, y: -4, transition: transition.exit }
            }
          >
            <nav aria-label="Main">
              <ul className={styles.primary}>
                {PRIMARY_NAV.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={styles.primaryLink}
                        aria-current={active ? "page" : undefined}
                        onClick={() => closeIfCurrent(item.href)}
                      >
                        {item.label}
                        <NavPendingSpinner />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className={styles.foot}>
              {signedIn && (
                <form action={signOut}>
                  <SubmitButton variant="secondary">Sign out</SubmitButton>
                </form>
              )}
              <nav aria-label="More">
                <ul className={styles.secondary}>
                  {SECONDARY_NAV.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} onClick={() => closeIfCurrent(item.href)}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
