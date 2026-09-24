"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { firstReleases, type ReleaseLine } from "@/lib/game-detail";
import styles from "./game.module.css";

/**
 * When the game came out on each platform. The short form shows each
 * platform's first release; every regional date is one press away, since a
 * big release can list twenty.
 */
export function ReleaseTable({ lines }: { lines: readonly ReleaseLine[] }) {
  const [all, setAll] = useState(false);
  const first = firstReleases(lines);
  const shown = all ? lines : first;

  return (
    <>
      <table className={styles.releases}>
        <thead className="visually-hidden">
          <tr>
            <th scope="col">Platform</th>
            <th scope="col">Date</th>
            <th scope="col">Regions</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((line) => (
            <tr key={`${line.platform}-${line.date}`}>
              <th scope="row">{line.platform}</th>
              <td className={styles.releaseDate}>{line.date}</td>
              <td className={styles.regions}>{line.regions.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {lines.length > first.length && (
        <Button
          size="sm"
          onClick={() => setAll((current) => !current)}
          className={styles.moreButton}
        >
          {all ? "Show first releases only" : `Show all ${lines.length} regional dates`}
        </Button>
      )}
    </>
  );
}
