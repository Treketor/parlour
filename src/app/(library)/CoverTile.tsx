import Link from "next/link";
import type { MouseEvent } from "react";
import { GameCover } from "@/components/ui/GameCover";
import type { LibraryItem } from "@/lib/data/library";
import styles from "./library.module.css";

type CoverTileProps = {
  item: Pick<LibraryItem, "title" | "platform" | "coverUrl">;
  href: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * The covers layout: the art and nothing else. The title and platform are
 * still the link's name, for screen readers, and a tooltip for a pointer.
 */
export function CoverTile({ item, href, onClick }: CoverTileProps) {
  const name = `${item.title}, ${item.platform}`;
  return (
    <Link href={href} onClick={onClick} className={styles.coverTile} aria-label={name} title={name}>
      <GameCover title={item.title} src={item.coverUrl} className={styles.tileCover} />
    </Link>
  );
}
