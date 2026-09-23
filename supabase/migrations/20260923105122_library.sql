-- Everything a person owns: profile, library entries, tags, queue and the
-- history of changes. Every table carries user_id and is locked to its owner
-- by row-level security from the start, so multiple accounts later is a
-- matter of opening sign-up, not rewriting access rules. See DECISIONS.md 022.

-- Shared trigger: keep updated_at honest without trusting the client.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 60),
  -- Price region, ISO 3166-1 alpha-2. Null until chosen; prices ask for it.
  country text check (country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- A profile row exists for every account, created with it. Security definer
-- because the new user has no rights yet when auth inserts them.
create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

-- Library entries -------------------------------------------------------------

-- One game on one platform (DECISIONS.md 005). Progress is exactly one state
-- (004); anything that can be true alongside it is a tag.
create table public.library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  game_id bigint not null references public.games (id) on delete restrict,
  platform_id integer not null references public.platforms (id) on delete restrict,
  ownership text not null
    check (ownership in ('owned', 'want_to_own', 'not_interested')),
  progress text not null default 'want_to_play'
    check (progress in ('want_to_play', 'playing', 'paused', 'finished', 'completed', 'abandoned')),
  -- Whole numbers 1 to 10; null is unrated and is never stored as 0 (003).
  rating smallint check (rating between 1 and 10),
  notes text not null default '' check (char_length(notes) <= 20000),
  started_on date,
  finished_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id, platform_id),
  check (finished_on is null or started_on is null or finished_on >= started_on)
);

create index library_entries_game_id_idx on public.library_entries (game_id);
create index library_entries_platform_id_idx on public.library_entries (platform_id);

create trigger library_entries_set_updated_at
  before update on public.library_entries
  for each row execute function public.set_updated_at();

-- Tags ------------------------------------------------------------------------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);

-- "Co-op" and "co-op" are the same tag.
create unique index tags_user_name_key on public.tags (user_id, lower(name));

create table public.entry_tags (
  entry_id uuid not null references public.library_entries (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (entry_id, tag_id)
);

create index entry_tags_tag_id_idx on public.entry_tags (tag_id);

-- Queue -----------------------------------------------------------------------

-- Ordered by a fractional index string, so moving an item rewrites one row.
-- Byte collation keeps the ordering the same in Postgres and in JavaScript.
create table public.queue_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  entry_id uuid not null unique references public.library_entries (id) on delete cascade,
  sort_key text collate "C" not null,
  created_at timestamptz not null default now(),
  unique (user_id, sort_key)
);

-- History ---------------------------------------------------------------------

-- Written only by the trigger below, never by the client, so it can be trusted
-- as a record of what changed and when.
create table public.entry_events (
  id bigint generated always as identity primary key,
  entry_id uuid not null references public.library_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  field text not null check (field in ('ownership', 'progress', 'rating')),
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index entry_events_entry_id_idx on public.entry_events (entry_id, created_at);
create index entry_events_user_id_idx on public.entry_events (user_id, created_at);

create function public.record_entry_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.entry_events (entry_id, user_id, field, old_value, new_value)
    values
      (new.id, new.user_id, 'ownership', null, new.ownership),
      (new.id, new.user_id, 'progress', null, new.progress);
    if new.rating is not null then
      insert into public.entry_events (entry_id, user_id, field, old_value, new_value)
      values (new.id, new.user_id, 'rating', null, new.rating::text);
    end if;
    return new;
  end if;

  if new.ownership is distinct from old.ownership then
    insert into public.entry_events (entry_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'ownership', old.ownership, new.ownership);
  end if;
  if new.progress is distinct from old.progress then
    insert into public.entry_events (entry_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'progress', old.progress, new.progress);
  end if;
  if new.rating is distinct from old.rating then
    insert into public.entry_events (entry_id, user_id, field, old_value, new_value)
    values (new.id, new.user_id, 'rating', old.rating::text, new.rating::text);
  end if;
  return new;
end;
$$;

create trigger library_entries_record_events
  after insert or update on public.library_entries
  for each row execute function public.record_entry_events();

-- Row-level security ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.library_entries enable row level security;
alter table public.tags enable row level security;
alter table public.entry_tags enable row level security;
alter table public.queue_items enable row level security;
alter table public.entry_events enable row level security;

-- Signed-out visitors have no business with personal tables at all.
revoke all on public.profiles, public.library_entries, public.tags, public.entry_tags,
  public.queue_items, public.entry_events from anon;

-- (select auth.uid()) rather than auth.uid(): evaluated once per query, not per row.

create policy "Read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Read own entries" on public.library_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Add own entries" on public.library_entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Update own entries" on public.library_entries
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own entries" on public.library_entries
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Read own tags" on public.tags
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Add own tags" on public.tags
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Rename own tags" on public.tags
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Delete own tags" on public.tags
  for delete to authenticated using (user_id = (select auth.uid()));

-- A tag can only join an entry when both belong to the same person.
create policy "Read own entry tags" on public.entry_tags
  for select to authenticated
  using (exists (
    select 1 from public.library_entries e
    where e.id = entry_id and e.user_id = (select auth.uid())
  ));
create policy "Tag own entries with own tags" on public.entry_tags
  for insert to authenticated
  with check (
    exists (
      select 1 from public.library_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.tags t
      where t.id = tag_id and t.user_id = (select auth.uid())
    )
  );
create policy "Untag own entries" on public.entry_tags
  for delete to authenticated
  using (exists (
    select 1 from public.library_entries e
    where e.id = entry_id and e.user_id = (select auth.uid())
  ));

-- Queue items may only point at your own entries.
create policy "Read own queue" on public.queue_items
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Queue own entries" on public.queue_items
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.library_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );
create policy "Reorder own queue" on public.queue_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.library_entries e
      where e.id = entry_id and e.user_id = (select auth.uid())
    )
  );
create policy "Remove from own queue" on public.queue_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- History is read-only to its owner; only the trigger writes it.
create policy "Read own history" on public.entry_events
  for select to authenticated using (user_id = (select auth.uid()));
