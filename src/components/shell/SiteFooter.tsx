import Link from "next/link";
import { SECONDARY_NAV } from "@/lib/nav";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer id="site-footer" className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.attribution}>
          Game data from{" "}
          <a href="https://www.igdb.com" rel="noopener">
            IGDB
          </a>
          . Prices from{" "}
          <a href="https://isthereanydeal.com" rel="noopener">
            IsThereAnyDeal
          </a>
          . Parlour is not affiliated with either.
        </p>
        <nav aria-label="Footer">
          <ul className={styles.links}>
            {SECONDARY_NAV.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
