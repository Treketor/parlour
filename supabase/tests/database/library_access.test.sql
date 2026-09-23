-- Access rules for the library tables. Runs inside a transaction that is
-- rolled back, so it leaves no trace; safe to run against any environment.
-- `supabase test db` runs it locally; README, "Database", explains running it
-- against the hosted project.

begin;

create extension if not exists pgtap with schema extensions;

select plan(22);

-- Fixtures, created as the database owner ---------------------------------------

insert into auth.users (id, email, aud, role)
values
  ('00000000-0000-4000-8000-00000000000a', 'reader-a@test.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000000b', 'reader-b@test.invalid', 'authenticated', 'authenticated');

insert into public.platforms (id, name, abbreviation, slug) values (6, 'PC (Microsoft Windows)', 'PC', 'win');
insert into public.games (id, slug, name) values (11737, 'outer-wilds', 'Outer Wilds');

select is(
  (select count(*)::int from public.profiles
   where id in ('00000000-0000-4000-8000-00000000000a', '00000000-0000-4000-8000-00000000000b')),
  2,
  'every new account gets a profile'
);

-- As person A ---------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

select lives_ok(
  $$ insert into public.library_entries (id, game_id, platform_id, ownership)
     values ('00000000-0000-4000-8000-0000000000e1', 11737, 6, 'owned') $$,
  'A can add a game to their own library'
);

select throws_ok(
  $$ insert into public.library_entries (user_id, game_id, platform_id, ownership)
     values ('00000000-0000-4000-8000-00000000000b', 11737, 6, 'owned') $$,
  '42501',
  null,
  'A cannot add an entry to someone else''s library'
);

select throws_ok(
  $$ insert into public.library_entries (game_id, platform_id, ownership)
     values (11737, 6, 'owned') $$,
  '23505',
  null,
  'the same game on the same platform cannot be added twice'
);

select throws_ok(
  $$ update public.library_entries set rating = 11 where id = '00000000-0000-4000-8000-0000000000e1' $$,
  '23514',
  null,
  'ratings above 10 are rejected'
);

select throws_ok(
  $$ update public.library_entries set rating = 0 where id = '00000000-0000-4000-8000-0000000000e1' $$,
  '23514',
  null,
  'a rating of 0 is rejected: unrated is null'
);

select throws_ok(
  $$ update public.library_entries set progress = 'beaten' where id = '00000000-0000-4000-8000-0000000000e1' $$,
  '23514',
  null,
  'progress must be one of the six states'
);

update public.library_entries
set progress = 'playing', rating = 9
where id = '00000000-0000-4000-8000-0000000000e1';

select is(
  (select array_agg(new_value order by id) from public.entry_events
   where entry_id = '00000000-0000-4000-8000-0000000000e1' and field = 'progress'),
  array['want_to_play', 'playing'],
  'progress changes are recorded in the history'
);

select throws_ok(
  $$ insert into public.entry_events (entry_id, user_id, field, new_value)
     values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-00000000000a', 'rating', '1') $$,
  '42501',
  null,
  'history cannot be written directly, only by the trigger'
);

insert into public.tags (id, name) values ('00000000-0000-4000-8000-0000000000a1', 'Co-op');

select throws_ok(
  $$ insert into public.tags (name) values ('co-op') $$,
  '23505',
  null,
  'tag names are unique regardless of case'
);

select throws_ok(
  $$ insert into public.games (id, slug, name) values (1, 'made-up', 'Made Up') $$,
  '42501',
  null,
  'signed-in users cannot write to the shared catalogue'
);

-- As person B ---------------------------------------------------------------------

set local request.jwt.claims to '{"sub": "00000000-0000-4000-8000-00000000000b", "role": "authenticated"}';

select is(
  (select count(*)::int from public.library_entries),
  0,
  'B cannot see A''s library'
);

select is(
  (select count(*)::int from public.entry_events),
  0,
  'B cannot see A''s history'
);

update public.library_entries set rating = 1 where id = '00000000-0000-4000-8000-0000000000e1';
delete from public.library_entries where id = '00000000-0000-4000-8000-0000000000e1';

select throws_ok(
  $$ insert into public.queue_items (entry_id, sort_key)
     values ('00000000-0000-4000-8000-0000000000e1', 'a0') $$,
  '42501',
  null,
  'B cannot queue A''s entry'
);

insert into public.tags (id, name) values ('00000000-0000-4000-8000-0000000000b1', 'Favourites');

select throws_ok(
  $$ insert into public.entry_tags (entry_id, tag_id)
     values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1') $$,
  '42501',
  null,
  'B cannot tag A''s entry'
);

select is(
  (select count(*)::int from public.profiles),
  1,
  'B sees only their own profile'
);

-- Back as A: B's attempts changed nothing --------------------------------------------

set local request.jwt.claims to '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

select is(
  (select rating from public.library_entries where id = '00000000-0000-4000-8000-0000000000e1'),
  9::smallint,
  'B''s update did not touch A''s entry'
);

select lives_ok(
  $$ insert into public.queue_items (entry_id, sort_key)
     values ('00000000-0000-4000-8000-0000000000e1', 'a0') $$,
  'A can queue their own entry'
);

select throws_ok(
  $$ insert into public.entry_tags (entry_id, tag_id)
     values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1') $$,
  '42501',
  null,
  'A cannot put B''s tag on their entry'
);

-- Signed out --------------------------------------------------------------------------

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select is(
  (select count(*)::int from public.games),
  1,
  'signed-out visitors can read the catalogue'
);

select throws_ok(
  $$ select count(*) from public.library_entries $$,
  '42501',
  null,
  'signed-out visitors cannot read any library'
);

select throws_ok(
  $$ select count(*) from public.profiles $$,
  '42501',
  null,
  'signed-out visitors cannot read profiles'
);

select * from finish();

rollback;
