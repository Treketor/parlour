-- The catalogue as cached from IGDB (DECISIONS.md 028). Everything here is
-- public to read and written only by the server with the service role, in one
-- transaction per batch through store_igdb_games().

-- Platforms and games: the fields the app shows ---------------------------------

alter table public.platforms
  add column generation smallint,
  -- IGDB platform_types: Console, Arcade, Platform, Operating_system, Portable_console, Computer.
  add column platform_type text,
  add column fetched_at timestamptz not null default now();

alter table public.games
  add column summary text,
  -- IGDB game_types name, e.g. "Main Game", "Remaster", "Port".
  add column game_type text,
  add column parent_game_id bigint,
  add column version_parent_id bigint,
  -- IGDB user score and critic aggregate, 0 to 100, always stored with their counts
  -- so the app never shows a score without saying how many people it came from.
  add column igdb_rating numeric(5, 2) check (igdb_rating between 0 and 100),
  add column igdb_rating_count integer not null default 0 check (igdb_rating_count >= 0),
  add column critic_rating numeric(5, 2) check (critic_rating between 0 and 100),
  add column critic_rating_count integer not null default 0 check (critic_rating_count >= 0),
  add column igdb_updated_at timestamptz,
  -- After this the record is refetched on next use. Detail pages check it.
  add column stale_after timestamptz not null default now() + interval '7 days';

-- Related records ---------------------------------------------------------------

create table public.genres (
  id integer primary key, -- IGDB genre id
  name text not null,
  slug text not null unique
);

create table public.game_genres (
  game_id bigint not null references public.games (id) on delete cascade,
  genre_id integer not null references public.genres (id) on delete cascade,
  primary key (game_id, genre_id)
);

create index game_genres_genre_id_idx on public.game_genres (genre_id);

create table public.game_platforms (
  game_id bigint not null references public.games (id) on delete cascade,
  platform_id integer not null references public.platforms (id) on delete cascade,
  primary key (game_id, platform_id)
);

create index game_platforms_platform_id_idx on public.game_platforms (platform_id);

create table public.release_dates (
  id bigint primary key, -- IGDB release date id
  game_id bigint not null references public.games (id) on delete cascade,
  platform_id integer references public.platforms (id) on delete cascade,
  -- IGDB release_date_regions, e.g. "europe", "worldwide".
  region text,
  -- Null when only a year, a quarter or nothing is known; see precision.
  released_on date,
  precision text not null check (precision in ('day', 'month', 'year', 'quarter', 'tbd')),
  -- IGDB's own wording, e.g. "Q3 2026" or "TBD", kept for the imprecise cases.
  label text
);

create index release_dates_game_id_idx on public.release_dates (game_id);
create index release_dates_platform_id_idx on public.release_dates (platform_id);

create table public.game_media (
  game_id bigint not null references public.games (id) on delete cascade,
  kind text not null check (kind in ('cover', 'screenshot', 'artwork')),
  image_id text not null,
  width integer,
  height integer,
  position smallint not null default 0,
  primary key (game_id, kind, image_id)
);

create table public.game_videos (
  game_id bigint not null references public.games (id) on delete cascade,
  -- YouTube video id.
  video_id text not null,
  name text,
  position smallint not null default 0,
  primary key (game_id, video_id)
);

-- A game's ids in other stores. Steam is how prices are matched in stage 9.
create table public.game_external_ids (
  game_id bigint not null references public.games (id) on delete cascade,
  source text not null check (source in ('steam', 'gog', 'epic')),
  uid text not null,
  primary key (game_id, source, uid)
);

create index game_external_ids_lookup_idx on public.game_external_ids (source, uid);

-- Server-only tables --------------------------------------------------------------

-- The IGDB app token. Twitch allows 25 live tokens per app and disables the
-- oldest beyond that, so one token is stored and shared by every server
-- instance instead of each fetching its own.
create table public.provider_tokens (
  provider text primary key check (provider in ('igdb')),
  access_token text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- Search results by normalised query, so repeating a search does not call IGDB.
create table public.igdb_search_cache (
  query text primary key,
  game_ids bigint[] not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Access ------------------------------------------------------------------------------

alter table public.genres enable row level security;
alter table public.game_genres enable row level security;
alter table public.game_platforms enable row level security;
alter table public.release_dates enable row level security;
alter table public.game_media enable row level security;
alter table public.game_videos enable row level security;
alter table public.game_external_ids enable row level security;
alter table public.provider_tokens enable row level security;
alter table public.igdb_search_cache enable row level security;

create policy "Anyone can read genres" on public.genres
  for select to anon, authenticated using (true);
create policy "Anyone can read game genres" on public.game_genres
  for select to anon, authenticated using (true);
create policy "Anyone can read game platforms" on public.game_platforms
  for select to anon, authenticated using (true);
create policy "Anyone can read release dates" on public.release_dates
  for select to anon, authenticated using (true);
create policy "Anyone can read game media" on public.game_media
  for select to anon, authenticated using (true);
create policy "Anyone can read game videos" on public.game_videos
  for select to anon, authenticated using (true);
create policy "Anyone can read external ids" on public.game_external_ids
  for select to anon, authenticated using (true);

-- No policies and no grants: only the service role, which bypasses both, may touch these.
revoke all on public.provider_tokens, public.igdb_search_cache from anon, authenticated;

-- Writing a batch ----------------------------------------------------------------------

-- Stores games exactly as mapped by src/server/igdb/map.ts, replacing each
-- game's related rows so removed screenshots or platforms do not linger.
-- One call is one transaction: a batch lands whole or not at all.
create function public.store_igdb_games(batch jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  game jsonb;
  current_game_id bigint;
begin
  insert into public.platforms (id, name, abbreviation, slug, generation, platform_type, fetched_at)
  select p.id, p.name, p.abbreviation, p.slug, p.generation, p.platform_type, now()
  from jsonb_to_recordset(batch -> 'platforms')
    as p(id integer, name text, abbreviation text, slug text, generation smallint, platform_type text)
  on conflict (id) do update set
    name = excluded.name,
    abbreviation = excluded.abbreviation,
    slug = excluded.slug,
    generation = excluded.generation,
    platform_type = excluded.platform_type,
    fetched_at = excluded.fetched_at;

  insert into public.genres (id, name, slug)
  select g.id, g.name, g.slug
  from jsonb_to_recordset(batch -> 'genres') as g(id integer, name text, slug text)
  on conflict (id) do update set name = excluded.name, slug = excluded.slug;

  for game in select * from jsonb_array_elements(batch -> 'games') loop
    current_game_id := (game ->> 'id')::bigint;

    insert into public.games (
      id, slug, name, summary, first_release_date, cover_image_id, game_type, parent_game_id,
      version_parent_id, igdb_rating, igdb_rating_count, critic_rating, critic_rating_count,
      igdb_updated_at, fetched_at, stale_after
    )
    values (
      current_game_id,
      game ->> 'slug',
      game ->> 'name',
      game ->> 'summary',
      (game ->> 'first_release_date')::date,
      game ->> 'cover_image_id',
      game ->> 'game_type',
      (game ->> 'parent_game_id')::bigint,
      (game ->> 'version_parent_id')::bigint,
      (game ->> 'igdb_rating')::numeric,
      coalesce((game ->> 'igdb_rating_count')::integer, 0),
      (game ->> 'critic_rating')::numeric,
      coalesce((game ->> 'critic_rating_count')::integer, 0),
      (game ->> 'igdb_updated_at')::timestamptz,
      now(),
      now() + interval '7 days'
    )
    on conflict (id) do update set
      slug = excluded.slug,
      name = excluded.name,
      summary = excluded.summary,
      first_release_date = excluded.first_release_date,
      cover_image_id = excluded.cover_image_id,
      game_type = excluded.game_type,
      parent_game_id = excluded.parent_game_id,
      version_parent_id = excluded.version_parent_id,
      igdb_rating = excluded.igdb_rating,
      igdb_rating_count = excluded.igdb_rating_count,
      critic_rating = excluded.critic_rating,
      critic_rating_count = excluded.critic_rating_count,
      igdb_updated_at = excluded.igdb_updated_at,
      fetched_at = excluded.fetched_at,
      stale_after = excluded.stale_after;

    delete from public.game_platforms where game_platforms.game_id = current_game_id;
    insert into public.game_platforms (game_id, platform_id)
    select current_game_id, value::integer
    from jsonb_array_elements_text(game -> 'platform_ids');

    delete from public.game_genres where game_genres.game_id = current_game_id;
    insert into public.game_genres (game_id, genre_id)
    select current_game_id, value::integer
    from jsonb_array_elements_text(game -> 'genre_ids');

    delete from public.release_dates where release_dates.game_id = current_game_id;
    insert into public.release_dates (id, game_id, platform_id, region, released_on, precision, label)
    select r.id, current_game_id, r.platform_id, r.region, r.released_on, r.precision, r.label
    from jsonb_to_recordset(game -> 'release_dates')
      as r(id bigint, platform_id integer, region text, released_on date, precision text, label text);

    delete from public.game_media where game_media.game_id = current_game_id;
    insert into public.game_media (game_id, kind, image_id, width, height, position)
    select current_game_id, m.kind, m.image_id, m.width, m.height, m.position
    from jsonb_to_recordset(game -> 'media')
      as m(kind text, image_id text, width integer, height integer, position smallint);

    delete from public.game_videos where game_videos.game_id = current_game_id;
    insert into public.game_videos (game_id, video_id, name, position)
    select current_game_id, v.video_id, v.name, v.position
    from jsonb_to_recordset(game -> 'videos') as v(video_id text, name text, position smallint);

    delete from public.game_external_ids where game_external_ids.game_id = current_game_id;
    insert into public.game_external_ids (game_id, source, uid)
    select current_game_id, e.source, e.uid
    from jsonb_to_recordset(game -> 'external_ids') as e(source text, uid text)
    on conflict do nothing;
  end loop;
end;
$$;

comment on function public.store_igdb_games(jsonb) is
  'Writes a mapped batch of IGDB games. Server only; see src/server/igdb/map.ts for the shape.';

-- Invoker rights, so it cannot do more than its caller; only the service role may call it.
revoke execute on function public.store_igdb_games(jsonb) from public, anon, authenticated;
grant execute on function public.store_igdb_games(jsonb) to service_role;
