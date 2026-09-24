"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { CloseIcon, PlayIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import type { MediaImage } from "@/lib/game-detail";
import { igdbImageUrl } from "@/lib/igdb-images";
import { transition } from "@/lib/motion";
import styles from "./game.module.css";

/** Trailers shown before asking: most games' first two are the ones people want. */
const PREVIEW = 2;

type Video = { id: string; name: string | null };

type TrailersProps = {
  title: string;
  videos: readonly Video[];
  /** The game's own images, used as posters so nothing loads from YouTube until asked. */
  posters: readonly MediaImage[];
};

/**
 * Trailers as posters until one is played. Playing opens it large, in the
 * same box as the images. The YouTube player, and every request to Google
 * that comes with it, loads only then, through the privacy-enhanced domain
 * the privacy page promises.
 */
export function Trailers({ title, videos, posters }: TrailersProps) {
  const [playing, setPlaying] = useState<Video | null>(null);
  const [all, setAll] = useState(false);
  const headingId = useId();
  const shown = all ? videos : videos.slice(0, PREVIEW);
  const nameOf = (video: Video) => video.name ?? `Trailer ${videos.indexOf(video) + 1}`;

  return (
    <>
      <ul className={styles.trailers}>
        {shown.map((video, index) => {
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
                <button
                  type="button"
                  className={styles.trailerPoster}
                  onClick={() => setPlaying(video)}
                  aria-label={`Play ${nameOf(video)}`}
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
              </div>
              <p className={styles.trailerName}>{nameOf(video)}</p>
            </motion.li>
          );
        })}
      </ul>
      {!all && videos.length > PREVIEW && (
        <Button size="sm" onClick={() => setAll(true)} className={styles.moreButton}>
          {`Show all ${videos.length} trailers`}
        </Button>
      )}

      <Modal
        open={playing !== null}
        onClose={() => setPlaying(null)}
        labelledBy={headingId}
        size="wide"
      >
        <div className={styles.viewer}>
          <div className={styles.viewerHead}>
            <h2 id={headingId} className={styles.viewerTitle}>
              {title}
              <span className={styles.viewerCount}>{playing && nameOf(playing)}</span>
            </h2>
            <IconButton label="Close" variant="quiet" onClick={() => setPlaying(null)}>
              <CloseIcon />
            </IconButton>
          </div>
          {playing && (
            <div className={styles.videoFrame}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(playing.id)}?autoplay=1&rel=0`}
                title={`${title}: ${nameOf(playing)}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
