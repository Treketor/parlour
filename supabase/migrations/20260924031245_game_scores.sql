-- Review scores from sources other than IGDB (DECISIONS.md 042): Metacritic's
-- metascore and RAWG's player rating, both through RAWG's API, and Steam's
-- user reviews. Public like the rest of the catalogue; written only by the
-- server through store_game_scores.

create table public.game_scores (
  game_id bigint not null references public.games (id) on delete cascade,
  source text not null check (source in ('metacritic', 'steam', 'rawg')),
  -- On the source's own scale, given by out_of: 100 for a metascore or a
  -- Steam percentage, 5 for RAWG's stars.
  score numeric(5, 2) not null check (score >= 0 and score <= out_of),
  out_of smallint not null check (out_of in (5, 100)),
  -- How many reviews or ratings stand behind it; null when the source does not say.
  count integer check (count >= 0),
  -- The source's own words, e.g. Steam's "Overwhelmingly Positive".
  label text,
  url text,
  primary key (game_id, source)
);

-- When each game's outside scores were last looked up, including lookups that
-- found nothing, so a game missing from RAWG is not searched on every visit.
create table public.game_score_checks (
  game_id bigint primary key references public.games (id) on delete cascade,
  checked_at timestamptz not null default now()
);

alter table public.game_scores enable row level security;
alter table public.game_score_checks enable row level security;

create policy "Anyone can read game scores" on public.game_scores
  for select to anon, authenticated using (true);

-- No policies and no grants: only the service role may touch the checks.
revoke all on public.game_score_checks from anon, authenticated;

-- Replaces a game's outside scores and records the check, in one transaction,
-- so a page never sees half of a refresh.
create function public.store_game_scores(target_game_id bigint, scores jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.game_scores where game_id = target_game_id;

  insert into public.game_scores (game_id, source, score, out_of, count, label, url)
  select target_game_id, s.source, s.score, s.out_of, s.count, s.label, s.url
  from jsonb_to_recordset(scores)
    as s(source text, score numeric, out_of smallint, count integer, label text, url text);

  insert into public.game_score_checks (game_id, checked_at)
  values (target_game_id, now())
  on conflict (game_id) do update set checked_at = excluded.checked_at;
end;
$$;

revoke execute on function public.store_game_scores(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.store_game_scores(bigint, jsonb) to service_role;
