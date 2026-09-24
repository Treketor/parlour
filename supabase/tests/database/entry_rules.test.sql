-- Rules on library entries beyond who can see them. Runs inside a transaction
-- that is rolled back, with its own fixture ids, so it is safe anywhere.

begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, email, aud, role)
values ('00000000-0000-4000-8000-0000000000c1', 'rules@test.invalid', 'authenticated', 'authenticated');
insert into public.platforms (id, name, abbreviation, slug) values (900101, 'Rules Platform', 'RP', 'rules-platform');
insert into public.games (id, slug, name) values (900101, 'rules-game', 'Rules Game');

insert into public.library_entries (id, user_id, game_id, platform_id, ownership)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1', 900101, 900101, 'owned');

select lives_ok(
  $$ update public.library_entries set progress = 'playing'
     where id = '00000000-0000-4000-8000-0000000000e1' $$,
  'an owned game can be played'
);

select throws_ok(
  $$ update public.library_entries set ownership = 'not_interested'
     where id = '00000000-0000-4000-8000-0000000000e1' $$,
  '23514',
  null,
  'a game being played cannot be marked not interested'
);

select throws_ok(
  $$ update public.library_entries set ownership = 'want_to_own'
     where id = '00000000-0000-4000-8000-0000000000e1' $$,
  '23514',
  null,
  'a game being played cannot be marked want to own'
);

select lives_ok(
  $$ update public.library_entries set progress = 'want_to_play', ownership = 'want_to_own'
     where id = '00000000-0000-4000-8000-0000000000e1' $$,
  'setting progress back first frees the ownership'
);

select throws_ok(
  $$ update public.library_entries set progress = 'finished'
     where id = '00000000-0000-4000-8000-0000000000e1' $$,
  '23514',
  null,
  'a game you only want to own cannot be finished'
);

select * from finish();

rollback;
