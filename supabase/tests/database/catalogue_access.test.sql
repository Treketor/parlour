-- Access rules for the IGDB catalogue, the stored token and the search cache.
-- Runs inside a transaction that is rolled back; safe against any environment.

begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Fixtures, written the way the server writes them -----------------------------------

select lives_ok(
  $$ select public.store_igdb_games('{
    "platforms": [{"id": 900001, "name": "Test Platform", "abbreviation": "TP", "slug": "test-platform", "generation": 9, "platform_type": "Console"}],
    "genres": [{"id": 900001, "name": "Test Genre", "slug": "test-genre"}],
    "games": [{
      "id": 900001, "slug": "test-game", "name": "Test Game", "summary": null,
      "first_release_date": "2026-01-02", "cover_image_id": "cover1", "game_type": "Main Game",
      "parent_game_id": null, "version_parent_id": null,
      "igdb_rating": 81.5, "igdb_rating_count": 12, "critic_rating": null, "critic_rating_count": 0,
      "igdb_updated_at": "2026-09-01T00:00:00Z",
      "platform_ids": [900001], "genre_ids": [900001],
      "release_dates": [{"id": 900001, "platform_id": 900001, "region": "worldwide", "released_on": "2026-01-02", "precision": "day", "label": "Jan 02, 2026"}],
      "media": [{"kind": "cover", "image_id": "cover1", "width": 264, "height": 374, "position": 0}],
      "videos": [{"video_id": "abc123", "name": "Trailer", "position": 0}],
      "external_ids": [{"source": "steam", "uid": "12345"}]
    }]
  }'::jsonb) $$,
  'the server can store a batch of games'
);

select is(
  (select count(*)::int from public.game_platforms where game_id = 900001),
  1,
  'related rows land with the game'
);

select lives_ok(
  $$ select public.store_igdb_games('{
    "platforms": [], "genres": [],
    "games": [{
      "id": 900001, "slug": "test-game", "name": "Test Game (renamed)",
      "igdb_rating_count": 12, "critic_rating_count": 0,
      "platform_ids": [], "genre_ids": [], "release_dates": [], "media": [], "videos": [], "external_ids": []
    }]
  }'::jsonb) $$,
  'storing a game again replaces it'
);

select is(
  (select count(*)::int from public.game_platforms where game_id = 900001)
    + (select count(*)::int from public.game_media where game_id = 900001),
  0,
  'related rows no longer in IGDB are removed on update'
);

insert into public.provider_tokens (provider, access_token, expires_at)
values ('igdb', 'secret-token', now() + interval '50 days')
on conflict (provider) do update set access_token = excluded.access_token;

insert into public.igdb_search_cache (query, game_ids, expires_at)
values ('test game', array[900001], now() + interval '1 day')
on conflict (query) do nothing;

-- Signed out -------------------------------------------------------------------------------

set local role anon;
set local request.jwt.claims to '{"role": "anon"}';

select is(
  (select name from public.games where id = 900001),
  'Test Game (renamed)',
  'signed-out visitors can read the catalogue'
);

select throws_ok(
  $$ select count(*) from public.provider_tokens $$,
  '42501',
  null,
  'signed-out visitors cannot see the IGDB token'
);

select throws_ok(
  $$ select count(*) from public.igdb_search_cache $$,
  '42501',
  null,
  'signed-out visitors cannot see the search cache'
);

select throws_ok(
  $$ select public.store_igdb_games('{"platforms": [], "genres": [], "games": []}'::jsonb) $$,
  '42501',
  null,
  'signed-out visitors cannot write games'
);

-- Signed in ----------------------------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims to '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

select throws_ok(
  $$ select count(*) from public.provider_tokens $$,
  '42501',
  null,
  'signed-in users cannot see the IGDB token'
);

select throws_ok(
  $$ select public.store_igdb_games('{"platforms": [], "genres": [], "games": []}'::jsonb) $$,
  '42501',
  null,
  'signed-in users cannot write games'
);

select throws_ok(
  $$ insert into public.game_media (game_id, kind, image_id) values (900001, 'cover', 'x') $$,
  '42501',
  null,
  'signed-in users cannot add catalogue media'
);

select is(
  (select count(*)::int from public.game_external_ids where game_id = 900001),
  0,
  'signed-in users can read external ids (none left after the update)'
);

select * from finish();

rollback;
