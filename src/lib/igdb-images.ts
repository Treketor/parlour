/*
 * IGDB image URLs are built from an image id and a named size (docs, "Images").
 * Sizes are maximums; `_2x` gives the double-density version for sharp screens.
 * WebP rather than JPEG: IGDB serves both, and WebP is the smaller download.
 */

export type IgdbImageSize =
  | "cover_small" // 90 x 128
  | "cover_big" // 264 x 374
  | "screenshot_med" // 569 x 320
  | "screenshot_big" // 889 x 500
  | "screenshot_huge" // 1280 x 720
  | "720p"
  | "1080p";

export function igdbImageUrl(imageId: string, size: IgdbImageSize, retina = false): string {
  return `https://images.igdb.com/igdb/image/upload/t_${size}${retina ? "_2x" : ""}/${encodeURIComponent(imageId)}.webp`;
}

const COVER_WIDTHS = { cover_small: 90, cover_big: 264 } as const;

/**
 * A cover at both densities as a width-described srcset, so the browser picks
 * the smallest file that is sharp at the size the layout gives it.
 */
export function igdbCoverSrcSet(imageId: string, size: keyof typeof COVER_WIDTHS): string {
  const width = COVER_WIDTHS[size];
  return `${igdbImageUrl(imageId, size)} ${width}w, ${igdbImageUrl(imageId, size, true)} ${width * 2}w`;
}
