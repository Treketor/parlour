"use client";

import { useState } from "react";
import { cx } from "@/lib/cx";
import styles from "./GameCover.module.css";

type GameCoverProps = {
  title: string;
  src?: string | undefined;
  size?: "thumb" | "card";
  /** Width-described candidates; `sizes` then says how wide the cover is drawn. */
  srcSet?: string | undefined;
  sizes?: string | undefined;
  /** Above the fold, likely the largest paint: fetched at once instead of lazily. */
  priority?: boolean;
  className?: string | undefined;
};

/**
 * Box art in a fixed 3:4 frame, so the space is reserved before the image
 * arrives. Games without art get a typeset cover instead of a broken image.
 */
export function GameCover({
  title,
  src,
  size = "card",
  srcSet,
  sizes,
  priority = false,
  className,
}: GameCoverProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = src !== undefined && !failed;

  return (
    <div className={cx(styles.cover, styles[size], className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- IGDB serves pre-sized images; next/image would re-encode them for no gain.
        <img
          // A cached image can finish before hydration, so onLoad never fires.
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0) setLoaded(true);
          }}
          className={styles.image}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt=""
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          data-loaded={loaded || undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        size === "card" && <span className={styles.fallbackTitle}>{title}</span>
      )}
    </div>
  );
}
