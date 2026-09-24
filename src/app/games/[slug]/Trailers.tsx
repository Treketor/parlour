"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlayIcon } from "@/components/ui/icons";
import type { MediaImage } from "@/lib/game-detail";
import { igdbImageUrl } from "@/lib/igdb-images";
import { transition } from "@/lib/motion";
import styles from "./game.module.css";

/** Trailers shown before asking: most games' first two are the ones people want. */
const PREVIEW = 2;

type TrailersProps = {
  title: string;
  videos: ReadonlyArray<{ id: string; name: string | null }>;
  /** The game's own images, used as posters so nothing loads from YouTube until asked. */
  posters: readonly MediaImage[];
};

/**
 * Trailers as posters until one is played. The YouTube player, and every
 * request to Google that comes with it, loads only on a press, through the
 * privacy-enhanced domain the privacy page promises.
 */
export function Trailers({ title, videos, posters }: TrailersProps) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const shown = all ? videos : videos.slice(0, PREVIEW);

  return (
    <>
      <ul className={styles.trailers}>
        {shown.map((video, index) => {
          const name = video.name ?? `Trailer ${index + 1}`;
          const poster = posters.length > 0 ? posters[index % posters.length] : undefined;
          return (
            <motion.li
              key={video.id}
              className={styles.trailer}
              // Only the ones revealed by "more" fade in; the first two are simply there.
              initial={index < PREVIEW ? false : { opacity: 0 }}
              animate={{ opacity: 1, transition: transition.enter }}
            >
              <div className={styles.trailerFrame}>
                {playing === video.id ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0`}
                    title={`${title}: ${name}`}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    className={styles.trailerPlayer}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.trailerPoster}
                    onClick={() => setPlaying(video.id)}
                    aria-label={`Play ${name}`}
                  >
                    {poster && (
                      // eslint-disable-next-line @next/next/no-img-element -- IGDB serves pre-sized images.
                      <img
                        src={igdbImageUrl(poster.imageId, "screenshot_med")}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className={styles.play}>
                      <PlayIcon width={20} height={20} />
                    </span>
                  </button>
                )}
              </div>
              <p className={styles.trailerName}>{name}</p>
            </motion.li>
          );
        })}
      </ul>
      {!all && videos.length > PREVIEW && (
        <Button size="sm" onClick={() => setAll(true)} className={styles.moreButton}>
          {`Show all ${videos.length} trailers`}
        </Button>
      )}
    </>
  );
}
