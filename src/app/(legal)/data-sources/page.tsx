import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/PageHeader";
import { formatDate } from "@/lib/format";
import styles from "../legal.module.css";
import { LEGAL_UPDATED } from "../updated";

export const metadata: Metadata = {
  title: "Data sources",
};

const sources = [
  {
    name: "IGDB",
    href: "https://www.igdb.com",
    provides:
      "Game titles, release dates, platforms, genres, cover art, screenshots, trailers and aggregate scores.",
    terms: "Used through the IGDB API, provided by Twitch, for non-commercial use.",
  },
  {
    name: "IsThereAnyDeal",
    href: "https://isthereanydeal.com",
    provides: "Current prices by store and price history for your region.",
    terms: "Store links are passed through exactly as provided, including any affiliate tags.",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com",
    provides: "Trailer playback, embedded in privacy-enhanced mode.",
    terms: "Walkthrough links open YouTube search in a new tab; nothing is scraped.",
  },
] as const;

export default function DataSourcesPage() {
  return (
    <>
      <PageHeader title="Data sources" meta={`Updated ${formatDate(LEGAL_UPDATED.dataSources)}`} />
      <div className={styles.body}>
        <p>
          Parlour does not write its own game data. Everything about a game comes from the services
          below, through their official APIs, cached so they are not asked twice for the same thing.
          None of them is connected yet; this page lists what each will provide, and is updated as
          they are. Parlour is not affiliated with or endorsed by any of them.
        </p>

        <dl className={styles.sources}>
          {sources.map((source) => (
            <div key={source.name} className={styles.source}>
              <dt>
                <a href={source.href} rel="noopener">
                  {source.name}
                </a>
              </dt>
              <dd>
                <span>{source.provides}</span>
                <span>{source.terms}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p>Your own ratings, notes, tags and queue are the only data that start in Parlour.</p>
      </div>
    </>
  );
}
