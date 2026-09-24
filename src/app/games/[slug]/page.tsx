import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { GameCover } from "@/components/ui/GameCover";
import { ExternalIcon } from "@/components/ui/icons";
import { libraryStatusFor, platformHabits, type EntryStatus } from "@/lib/data/library";
import { formatDate } from "@/lib/format";
import { guideLinks, releaseLines, storeLinks } from "@/lib/game-detail";
import { igdbImageUrl } from "@/lib/igdb-images";
import { createClient } from "@/lib/supabase/server";
import { getCatalogue } from "@/server/catalogue";
import { LibraryPanel } from "./LibraryPanel";
import { MediaGallery } from "./MediaGallery";
import { ReleaseTable } from "./ReleaseTable";
import { Scores } from "./Scores";
import { Trailers } from "./Trailers";
import styles from "./game.module.css";

// The page and its metadata both need the game; this asks the catalogue once per request.
const gameFor = cache((slug: string) => getCatalogue().detail(slug));

export async function generateMetadata({ params }: PageProps<"/games/[slug]">): Promise<Metadata> {
  const game = await gameFor((await params).slug);
  return { title: game?.name ?? "Game not found" };
}

export default async function GamePage({ params }: PageProps<"/games/[slug]">) {
  const { slug } = await params;
  const game = await gameFor(slug);
  if (!game) notFound();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const signedIn = Boolean(auth?.claims);
  const [statuses, habits] = signedIn
    ? await Promise.all([libraryStatusFor(supabase, [game.id]), platformHabits(supabase)])
    : [new Map<string, EntryStatus>(), {}];

  const releases = releaseLines(game.releases);
  const links = [...storeLinks(game.externalIds), ...guideLinks(game.name)];
  const media = [...game.screenshots, ...game.artworks];
  const released = game.firstReleaseDate ? new Date(`${game.firstReleaseDate}T00:00:00Z`) : null;

  return (
    <article className={styles.page} aria-labelledby="game-title">
      <aside className={styles.side}>
        <GameCover
          title={game.name}
          src={game.coverImageId ? igdbImageUrl(game.coverImageId, "cover_big", true) : undefined}
          className={styles.cover}
        />
        <LibraryPanel
          game={game}
          statuses={Object.fromEntries(statuses)}
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
          <p className={styles.facts}>
            <span>{released ? formatDate(released) : "Release date TBA"}</span>
            {game.genres.map((genre) => (
              <span key={genre}>{genre}</span>
            ))}
          </p>
        </header>

        <Scores game={game} />

        {game.summary && <p className={styles.summary}>{game.summary}</p>}

        {releases.length > 0 && (
          <section className={styles.section} aria-labelledby="released">
            <h2 id="released" className={styles.sectionTitle}>
              Released
            </h2>
            <ReleaseTable lines={releases} />
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
