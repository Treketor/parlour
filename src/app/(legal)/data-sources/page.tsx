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
    name: "RAWG",
    href: "https://rawg.io",
    provides: "Metacritic's metascore and RAWG's own player rating, on game pages.",
    terms:
      "Used through the RAWG API, free for personal projects with a link to RAWG wherever its data appears.",
  },
  {
    name: "Steam",
    href: "https://store.steampowered.com",
    provides: "The share of positive user reviews, for games sold on Steam.",
    terms: "Read from the Steam store's public review summary; no account or key is involved.",
  },
  {
    name: "IsThereAnyDeal",
    href: "https://isthereanydeal.com",
    provides:
      "Current prices by shop, the lowest recorded prices, and a year of price history, for the region you choose.",
    terms:
      "Used through the IsThereAnyDeal API. Shop links are passed through exactly as provided, including any affiliate tags.",
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
          Parlour is not affiliated with or endorsed by any of them.
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
