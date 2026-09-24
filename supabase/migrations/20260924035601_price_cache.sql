-- Prices from IsThereAnyDeal (DECISIONS.md 045). Both tables are server-only
-- caches, written and read with the service role, like the IGDB token.

-- Which IsThereAnyDeal game each game is. itad_id is null when the lookup
-- found nothing, which is remembered too so it is not asked on every visit.
create table public.game_price_ids (
  game_id bigint primary key references public.games (id) on delete cascade,
  itad_id uuid,
  checked_at timestamptz not null default now()
);

-- Prices and price history per game and region, as the app maps them.
create table public.price_cache (
  game_id bigint not null references public.games (id) on delete cascade,
  country text not null check (country ~ '^[A-Z]{2}$'),
  kind text not null check (kind in ('prices', 'history')),
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  primary key (game_id, country, kind)
);

alter table public.game_price_ids enable row level security;
alter table public.price_cache enable row level security;

-- No policies and no grants: only the service role, which bypasses both, may touch these.
revoke all on public.game_price_ids, public.price_cache from anon, authenticated;
