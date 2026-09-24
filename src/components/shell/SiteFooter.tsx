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
          . Scores from Metacritic via{" "}
          <a href="https://rawg.io" rel="noopener">
            RAWG
          </a>{" "}
          and from{" "}
          <a href="https://store.steampowered.com" rel="noopener">
            Steam
          </a>
          . Prices from{" "}
          <a href="https://isthereanydeal.com" rel="noopener">
            IsThereAnyDeal
          </a>
          . Parlour is not affiliated with any of them.
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
