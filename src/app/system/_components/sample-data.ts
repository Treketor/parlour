import type { ListRowData } from "@/components/ui/ListRow";

export type SampleGame = ListRowData & { id: string };

/*
 * Real games so type and truncation are tested against real title lengths.
 * Cover art arrives with IGDB in stage 4; until then every cover shows the
 * designed no-art state, which is also what an entry without art looks like.
 */
export const sampleGames: SampleGame[] = [
  {
    id: "outer-wilds",
    title: "Outer Wilds",
    year: 2019,
    platform: "PC",
    progress: "finished",
    rating: 10,
    addedAt: new Date("2025-11-02"),
  },
  {
    id: "disco-elysium",
    title: "Disco Elysium: The Final Cut",
    year: 2021,
    platform: "PC",
    progress: "completed",
    rating: 9,
    addedAt: new Date("2025-06-14"),
  },
  {
    id: "tunic",
    title: "Tunic",
    year: 2022,
    platform: "Nintendo Switch",
    progress: "playing",
    rating: null,
    addedAt: new Date("2026-08-30"),
  },
  {
    id: "obra-dinn",
    title: "Return of the Obra Dinn",
    year: 2018,
    platform: "PC",
    progress: "finished",
    rating: 9,
    addedAt: new Date("2024-12-21"),
  },
  {
    id: "signalis",
    title: "Signalis",
    year: 2022,
    platform: "PlayStation 5",
    progress: "paused",
    rating: 8,
    addedAt: new Date("2026-02-09"),
  },
  {
    id: "pentiment",
    title: "Pentiment",
    year: 2022,
    platform: "Xbox Series X|S",
    progress: "want_to_play",
    rating: null,
    addedAt: new Date("2026-09-12"),
  },
  {
    id: "hollow-knight",
    title: "Hollow Knight",
    year: 2017,
    platform: "Nintendo Switch",
    progress: "abandoned",
    rating: 7,
    addedAt: new Date("2023-03-05"),
  },
  {
    id: "elder-scrolls-vi",
    title: "The Elder Scrolls VI",
    year: null,
    platform: "PC",
    progress: "want_to_play",
    rating: null,
    addedAt: new Date("2026-01-18"),
  },
];
