import { ButtonLink } from "@/components/ui/Button";
import { ProgressLabel } from "@/components/ui/ProgressGlyph";
import { PROGRESS_STATES, progressDescription } from "@/lib/progress";
import styles from "./library.module.css";

/** What a signed-in person with no games sees: one clear next step, and the vocabulary. */
export function LibraryEmpty() {
  return (
    <section className={styles.empty} aria-labelledby="empty-title">
      <div className={styles.start}>
        <h2 id="empty-title" className={styles.emptyTitle}>
          Start with the game you are playing now
        </h2>
        <p className={styles.emptyBody}>
          Search for it, pick the platform you play it on, and it lands here. Each platform gets its
          own entry, so the Switch and PC versions of a game can have different progress, ratings
          and notes.
        </p>
        <ButtonLink href="/search" variant="primary">
          Search for a game
        </ButtonLink>
      </div>

      <div className={styles.legend}>
        <h2 className={styles.legendTitle}>How progress is tracked</h2>
        <dl className={styles.states}>
          {PROGRESS_STATES.map((state) => (
            <div key={state} className={styles.state}>
              <dt>
                <ProgressLabel progress={state} />
              </dt>
              <dd>{progressDescription[state]}</dd>
            </div>
          ))}
        </dl>
        <p className={styles.legendNote}>
          Ratings are whole numbers from 1 to 10, or none at all. Anything else, like wanting to go
          back for 100%, is a tag.
        </p>
      </div>
    </section>
  );
}
