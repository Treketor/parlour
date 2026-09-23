import Link from "next/link";
import styles from "./SiteFooter.module.css";

const links = [
  { href: "/data-sources", label: "Data sources" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/system", label: "Design system" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
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
            {links.map((link) => (
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
