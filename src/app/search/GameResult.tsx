import { GameCover } from "@/components/ui/GameCover";
import type { CatalogueGame } from "@/lib/catalogue";
import { entryKey } from "@/lib/data/add-entry";
import type { EntryStatus } from "@/lib/data/library";
import { formatCount } from "@/lib/format";
import { igdbImageUrl } from "@/lib/igdb-images";
import { MIN_CRITIC_RATINGS, MIN_USER_RATINGS, scoreToShow } from "@/lib/scores";
import { PlatformRow } from "./PlatformRow";
import styles from "./search.module.css";

type GameResultProps = {
  game: CatalogueGame;
  statuses: Map<string, EntryStatus>;
  signedIn: boolean;
  returnTo: string;
};

/** One game, then one row per platform: you add the version you actually play. */
export function GameResult({ game, statuses, signedIn, returnTo }: GameResultProps) {
  const year = game.firstReleaseDate ? game.firstReleaseDate.slice(0, 4) : "TBA";
  const critics = scoreToShow(game.criticRating, game.criticRatingCount, MIN_CRITIC_RATINGS);
  const players = scoreToShow(game.igdbRating, game.igdbRatingCount, MIN_USER_RATINGS);

  return (
    <li className={styles.result}>
      <GameCover
        title={game.name}
        src={game.coverImageId ? igdbImageUrl(game.coverImageId, "cover_small", true) : undefined}
        className={styles.resultCover}
      />

      <div className={styles.resultBody}>
        <div className={styles.resultHead}>
          <h2 className={styles.resultTitle}>{game.name}</h2>
          <p className={styles.resultMeta}>
            <span className={styles.metaItem}>{year}</span>
            {game.gameType && game.gameType !== "Main Game" && (
              <span className={styles.metaItem}>{game.gameType}</span>
            )}
            {critics && (
              <span className={styles.metaItem}>
                Critics <strong>{critics.value}</strong>{" "}
                <span className={styles.count}>({formatCount(critics.count, "review")})</span>
              </span>
            )}
            {players && (
              <span className={styles.metaItem}>
                Players <strong>{players.value}</strong>{" "}
                <span className={styles.count}>({formatCount(players.count, "rating")})</span>
              </span>
            )}
          </p>
        </div>

        {game.platforms.length > 0 ? (
          <ul className={styles.platforms} aria-label={`${game.name} platforms`}>
            {game.platforms.map((platform) => (
              <li key={platform.id}>
                <PlatformRow
                  gameId={game.id}
                  gameName={game.name}
                  platform={platform}
                  status={statuses.get(entryKey(game.id, platform.id)) ?? null}
                  signedIn={signedIn}
                  returnTo={returnTo}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noPlatforms}>IGDB lists no platforms for this game yet.</p>
        )}
      </div>
    </li>
  );
}
