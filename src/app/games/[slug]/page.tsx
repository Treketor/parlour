import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
import { GameCover } from "@/components/ui/GameCover";
import { ExternalIcon } from "@/components/ui/icons";
import {
  libraryStatusFor,
  listLibrary,
  platformHabits,
  type EntryStatus,
} from "@/lib/data/library";
import { guideLinks, releaseLines, releaseState, storeLinks } from "@/lib/game-detail";
import { igdbCoverSrcSet, igdbImageUrl } from "@/lib/igdb-images";
import { createClient } from "@/lib/supabase/server";
import { getCatalogue } from "@/server/catalogue";
import { LibraryPanel } from "./LibraryPanel";
import { MediaGallery } from "./MediaGallery";
import { GamePrices, GamePricesSkeleton } from "./Prices";
import { ReleaseTable } from "./ReleaseTable";
import { GameScores, GameScoresSkeleton } from "./Scores";
import { Trailers } from "./Trailers";
import styles from "./game.module.css";

// The page and its metadata both need the game; this asks the catalogue once per request.
const gameFor = cache((slug: string) => getCatalogue().detail(slug));

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const game = await gameFor((await params).slug);
  if (!game) return { title: "Game not found" };
  return {
    title: game.name,
    ...(game.summary && { description: descriptionFrom(game.summary) }),
  };
}

/** A summary cut to what a search result shows, at a word boundary. */
function descriptionFrom(summary: string): string {
  const flat = summary.replace(/\s+/g, " ").trim();
  if (flat.length <= 160) return flat;
  return `${flat.slice(0, flat.lastIndexOf(" ", 157))}...`;
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const game = await gameFor(slug);
  if (!game) notFound();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const signedIn = Boolean(auth?.claims);
  const [statuses, habits, entries] = signedIn
    ? await Promise.all([
        libraryStatusFor(supabase, [game.id]),
        platformHabits(supabase),
        listLibrary(supabase, { gameId: game.id }),
      ])
    : [new Map<string, EntryStatus>(), {}, []];

  const releases = releaseLines(game.releases);
  const links = [...storeLinks(game.externalIds), ...guideLinks(game.name)];
  const media = [...game.screenshots, ...game.artworks];
  const today = new Date().toISOString().slice(0, 10);
  const release = releaseState(
    game.firstReleaseDate,
    game.releases,
    new Date().toISOString().slice(0, 10),
  );

  return (
    <article className={styles.page} aria-labelledby="game-title">
      <aside className={styles.side}>
        <GameCover
          title={game.name}
          src={game.coverImageId ? igdbImageUrl(game.coverImageId, "cover_big", true) : undefined}
          srcSet={game.coverImageId ? igdbCoverSrcSet(game.coverImageId, "cover_big") : undefined}
          sizes="(min-width: 60rem) 16rem, 7rem"
          priority
          className={styles.cover}
        />
        <LibraryPanel
          game={game}
          statuses={Object.fromEntries(statuses)}
          details={Object.fromEntries(entries.map((entry) => [entry.id, entry]))}
          habits={habits}
          signedIn={signedIn}
          returnTo={`/games/${game.slug}`}
        />
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <h1 id="game-title" className={styles.title}>
            {game.name}
          </h1>
          <div className={styles.facts}>
            <p className={styles.releaseState} data-status={release.status}>
              {release.label}
            </p>
            {game.genres.length > 0 && (
              <ul className={styles.genres} aria-label="Genres">
                {game.genres.map((genre) => (
                  <li key={genre} className={styles.genre}>
                    {genre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        <Suspense fallback={<GameScoresSkeleton />}>
          <GameScores game={game} released={release.status === "released"} />
        </Suspense>

        {game.summary && <p className={styles.summary}>{game.summary}</p>}

        <Suspense fallback={<GamePricesSkeleton />}>
          <GamePrices game={game} />
        </Suspense>

        {releases.length > 0 && (
          <section className={styles.section} aria-labelledby="released">
            <h2 id="released" className={styles.sectionTitle}>
              Release dates
            </h2>
            <ReleaseTable lines={releases} today={today} />
          </section>
        )}

        {media.length > 0 && (
          <section className={styles.section} aria-labelledby="media">
            <h2 id="media" className={styles.sectionTitle}>
              Screenshots and artwork
            </h2>
            <MediaGallery title={game.name} images={media} />
          </section>
        )}

        {game.videos.length > 0 && (
          <section className={styles.section} aria-labelledby="trailers">
            <h2 id="trailers" className={styles.sectionTitle}>
              Trailers
            </h2>
            <Trailers title={game.name} videos={game.videos} posters={media} />
          </section>
        )}

        <section className={styles.section} aria-labelledby="links">
          <h2 id="links" className={styles.sectionTitle}>
            Guides and stores
          </h2>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  <span className={styles.linkLabel}>
                    {link.label}
                    <ExternalIcon width={14} height={14} className={styles.linkIcon} />
                  </span>
                  <span className={styles.linkDescription}>{link.description}</span>
                  <span className="visually-hidden">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  );
}
