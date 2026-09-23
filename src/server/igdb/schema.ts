import { z } from "zod";

/*
 * The shape of a game as requested by GAME_FIELDS. Every nested field is
 * optional because IGDB omits empty ones rather than sending nulls. Unknown
 * keys are dropped, so new IGDB fields cannot break parsing.
 */

const image = z.object({
  image_id: z.string(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
});

const platform = z.object({
  id: z.number().int(),
  name: z.string(),
  abbreviation: z.string().optional(),
  slug: z.string(),
  generation: z.number().int().optional(),
  platform_type: z.number().int().optional(),
});

export const igdbGame = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  summary: z.string().optional(),
  /** Unix seconds. */
  first_release_date: z.number().int().optional(),
  /** Unix seconds. */
  updated_at: z.number().int().optional(),
  game_type: z.number().int().optional(),
  parent_game: z.number().int().optional(),
  version_parent: z.number().int().optional(),
  rating: z.number().optional(),
  rating_count: z.number().int().optional(),
  aggregated_rating: z.number().optional(),
  aggregated_rating_count: z.number().int().optional(),
  cover: image.optional(),
  screenshots: z.array(image).optional(),
  artworks: z.array(image).optional(),
  videos: z.array(z.object({ video_id: z.string(), name: z.string().optional() })).optional(),
  genres: z
    .array(z.object({ id: z.number().int(), name: z.string(), slug: z.string() }))
    .optional(),
  platforms: z.array(platform).optional(),
  release_dates: z
    .array(
      z.object({
        id: z.number().int(),
        /** Unix seconds; absent when only a year or nothing is known. */
        date: z.number().int().optional(),
        date_format: z.number().int().optional(),
        human: z.string().optional(),
        platform: z.number().int().optional(),
        release_region: z.number().int().optional(),
      }),
    )
    .optional(),
  external_games: z
    .array(
      z.object({
        uid: z.string().optional(),
        external_game_source: z.number().int().optional(),
      }),
    )
    .optional(),
});

export type IgdbGame = z.infer<typeof igdbGame>;

export const igdbGames = z.array(igdbGame);
