"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import type { MediaImage } from "@/lib/game-detail";
import { igdbImageUrl } from "@/lib/igdb-images";
import { transition } from "@/lib/motion";
import styles from "./game.module.css";

type MediaGalleryProps = { title: string; images: readonly MediaImage[] };

/** Frames shown before "Show all". */
const PREVIEW = 6;

/**
 * Screenshots and artwork as a grid of small frames; one opens large in a
 * box, and the arrows or arrow keys step through the rest.
 */
export function MediaGallery({ title, images }: MediaGalleryProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const headingId = useId();
  const current = open === null ? undefined : images[open];

  function step(by: number) {
    setOpen((index) => (index === null ? null : (index + by + images.length) % images.length));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
  }

  return (
    <>
      <ul className={styles.gallery}>
        {(all ? images : images.slice(0, PREVIEW)).map((image, index) => (
          <motion.li
            key={image.imageId}
            // Only frames revealed by "Show all" fade in; the first six are simply there.
            initial={index < PREVIEW ? false : { opacity: 0 }}
            animate={{ opacity: 1, transition: transition.enter }}
          >
            <button
              type="button"
              className={styles.thumb}
              aria-label={`Open image ${index + 1} of ${images.length}`}
              onClick={() => setOpen(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- IGDB serves pre-sized images; next/image would re-encode them for no gain. */}
              <img
                src={igdbImageUrl(image.imageId, "screenshot_med")}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </button>
          </motion.li>
        ))}
      </ul>
      {images.length > PREVIEW && (
        <Button
          size="sm"
          onClick={() => setAll((current) => !current)}
          className={styles.moreButton}
        >
          {all ? "Show fewer" : `Show all ${images.length} images`}
        </Button>
      )}

      <Modal
        open={current !== undefined}
        onClose={() => setOpen(null)}
        labelledBy={headingId}
        size="wide"
      >
        {/* Arrow keys step while the box is open; everything else keeps its usual job. */}
        <div className={styles.viewer} onKeyDown={onKeyDown}>
          <div className={styles.viewerHead}>
            <h2 id={headingId} className={styles.viewerTitle}>
              {title}
              <span className={styles.viewerCount}>
                {open !== null && `${open + 1} of ${images.length}`}
              </span>
            </h2>
            <IconButton label="Close" variant="quiet" onClick={() => setOpen(null)}>
              <CloseIcon />
            </IconButton>
          </div>
          <div className={styles.viewerFrame}>
            {/* Stepping crossfades: the frame stays put and the pictures trade places in it. */}
            <AnimatePresence initial={false}>
              {current && (
                <motion.img
                  key={current.imageId}
                  src={igdbImageUrl(current.imageId, "1080p")}
                  alt={`${title}, image ${(open ?? 0) + 1} of ${images.length}`}
                  className={styles.viewerImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: transition.enter }}
                  exit={{ opacity: 0, transition: transition.exit }}
                />
              )}
            </AnimatePresence>
          </div>
          {images.length > 1 && (
            <div className={styles.viewerNav}>
              <IconButton label="Previous image" onClick={() => step(-1)}>
                <ChevronLeftIcon />
              </IconButton>
              <IconButton label="Next image" onClick={() => step(1)}>
                <ChevronRightIcon />
              </IconButton>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
