-- Catalogue records cached from IGDB. Shared by every user and written only by
-- the server with the service role, so there are read policies and no write
-- policies. Stage 4 extends these tables once the IGDB fields are settled.

create table public.platforms (
  id integer primary key, -- IGDB platform id
  name text not null,
  abbreviation text,
  slug text not null unique
);

comment on table public.platforms is 'Platforms from IGDB. Written by the server only.';

create table public.games (
  id bigint primary key, -- IGDB game id
  slug text not null unique,
  name text not null,
  first_release_date date,
  cover_image_id text,
  fetched_at timestamptz not null default now()
);

comment on table public.games is 'Games cached from IGDB, shared by all users. Written by the server only.';

alter table public.platforms enable row level security;
alter table public.games enable row level security;

-- Catalogue data is public: it is shown to anyone, signed in or not.
create policy "Anyone can read platforms"
  on public.platforms for select
  to anon, authenticated
  using (true);

create policy "Anyone can read games"
  on public.games for select
  to anon, authenticated
  using (true);
