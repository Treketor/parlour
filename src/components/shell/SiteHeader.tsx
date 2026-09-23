"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutTransition } from "@/components/Providers";
import { ButtonLink } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";
import { PRIMARY_NAV, isActivePath } from "@/lib/nav";
import { MobileMenu } from "./MobileMenu";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const slide = useLayoutTransition("slide");

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark}>
          Parlour
        </Link>

        <nav className={styles.nav} aria-label="Main">
          <ul>
            {PRIMARY_NAV.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.navLink}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    {active && (
                      // Slides to the new item on navigation, so you see where you went.
                      <motion.span
                        layoutId="nav-current"
                        className={styles.marker}
                        transition={slide}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <ButtonLink
          href="/search"
          variant="primary"
          size="sm"
          className={styles.add}
          icon={<PlusIcon width={14} height={14} />}
        >
          Add a game
        </ButtonLink>

        <div className={styles.menu}>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
