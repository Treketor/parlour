# Decisions

Significant technical and design decisions, newest at the bottom. Each entry records what was decided and why, so later changes can be made knowing what they undo.

## 001. Hosted from the start, not local-first

Supabase (Postgres and Auth) holds library data from stage 3 onward.

IGDB forbids browser requests (CORS, and the token must stay secret), so a server exists regardless. Multi-user accounts are on the roadmap. Local-first would add a sync layer to solve an offline problem this app does not have; optimistic UI gives the same instant feel for my own actions.

## 002. Stack

- Next.js (App Router) with TypeScript in strict mode, plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Route handlers act as the IGDB and IsThereAnyDeal proxy.
- CSS Modules with CSS custom properties, no Tailwind. Every visual value comes from a token we chose; utility defaults pull toward a generic look.
- Motion (motion.dev) for layout animation only; CSS transitions for everything smaller.
- TanStack Query for server state and optimistic updates (from stage 5).
- dnd-kit for queue reordering (stage 10).
- Vitest for the data layer and logic; Playwright for end-to-end and responsive screenshots.
- Vercel for hosting.

Trade-off accepted: Next.js caching semantics change between versions, so provider caching lives in Postgres, where we control it.

## 003. Rating scale: whole numbers 1 to 10, shown as numerals

Chosen as the least misleading option. Stars get rounded by the reader, half-stars imply precision that does not exist, a 100-point scale is false precision, and 5 points cannot separate good from great. "Unrated" is its own state and is never stored as 0.

The same principle applies to third-party scores: an IGDB score is always shown with its rating count, and hidden with an explanation below a minimum count.

## 004. Progress is one state; tags are many

Progress is exactly one of: want to play, playing, paused, finished (credits), completed (100%), abandoned. Anything that can be true alongside a progress state, such as "want to complete", is a tag. Tags are user-defined, with a few seeded defaults.

Without this split, a game could not be both finished and wanting completion.

## 005. Library entries are per platform

An entry is one game on one platform. Search lists a game once per platform it is on, because versions can differ substantially. Ownership, progress, rating and notes belong to the entry. The queue references entries, not games. Library views can still group entries by game.

## 006. Prices follow a region setting

A country on the profile decides both the IsThereAnyDeal region and the currency. Price data is cached per country.

## 007. Dark mode only

One tuned palette instead of two compromised ones. Background is a warm near-black, never #000.

## 008. Working name: Shelfmark

A shelfmark is the mark that locates a book in a library. It fits the catalogue character and has no gaming connotation. It's a placeholder until confirmed.

## 009. Two visual directions built side by side in stage 1

The brief asks for clean, minimal, modern and stylised, not nerdy or game-like. Monospace faces and IBM Plex are excluded because they read as developer tooling. Stage 1 builds two directions on the same token set and components so the choice can be made by looking at them, not by description:

- Editorial: serif display over a restrained sans.
- Swiss: a single characterful grotesk, large scale contrast.

The rejected direction is deleted after review.

## 010. Motion system

Three curves, five durations, used everywhere:

| Token         | Value                          | Use                                                                      |
| ------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `ease-out`    | cubic-bezier(0.22, 1, 0.36, 1) | Anything responding to input or entering. Fast start reads as immediate. |
| `ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | Things travelling between two resting places (reorders).                 |
| `ease-in`     | cubic-bezier(0.55, 0, 1, 0.45) | Exits: accelerate out of the way.                                        |
| `press`       | 70ms                           | Release of a pressed state. Press itself applies with no transition.     |
| `fast`        | 120ms                          | Hover, colour changes, exits.                                            |
| `base`        | 180ms                          | Popovers, small reveals.                                                 |
| `slow`        | 240ms                          | Indicators sliding between options.                                      |
| `spatial`     | 320ms                          | Rows moving to new positions.                                            |

Only `transform` and `opacity` animate. Hover changes colour only; nothing lifts or grows on hover.

Reduced motion is a real variant rather than an off switch. Distances and press scale collapse to zero, long durations shorten, and state changes still crossfade so the change remains visible. Motion's `reducedMotion="user"` does the same for JS animations: it drops transform and layout animation and keeps opacity.

Layout animation on reorder is limited to lists of 100 visible items or fewer. Past that, measuring every row costs frames, and the list crossfades instead.

Tokens live in `tokens.css`; `src/lib/motion.ts` mirrors them for Motion, and a test fails if the two drift.

## 011. Colour

Warm near-black ground (`#1a1917`) with surfaces stepped up in lightness instead of shadows. The Editorial direction uses a brass accent (`#c8a565`), taken from the label frames on card-catalogue drawers. Swiss uses a cool steel (`#9db7d5`). The accent marks only current, selected and focused things, plus the primary action.

Progress states do not get a colour each, which would turn into a rainbow. They get small drawn glyphs and a text label; only "playing" uses the accent. The error colour is a muted coral and appears nowhere else.

Measured contrast against the canvas: body 14.0:1, muted 8.7:1, faint 6.0:1, brass 7.6:1, steel 8.5:1, error 7.0:1. Faint text stays above 4.5:1 on every surface step, down to the pressed fill. Control edges use a separate `control-line` token at 3.3:1, because WCAG 1.4.11 needs input boundaries at 3:1 and the decorative hairlines are deliberately much quieter.

## 012. Typefaces, and a check that figures really are tabular

Editorial: Source Serif 4 for display and reading text (its optical-size axis tightens it at display sizes), Public Sans for the interface. Swiss: Schibsted Grotesk throughout.

Libre Franklin was the first choice for the Editorial interface face. It was dropped after measuring it in the browser: the Google Fonts build ignores `tabular-nums`, so a "1" and an "8" are different widths and price columns would jiggle. Public Sans is derived from Libre Franklin, looks almost the same, and its tabular figures work. All three faces were measured, not assumed.

Tabular figures are used only where numbers stack in a column: tables, list rows, the rating column. Anywhere a number stands alone (a card's year, a single score), figures are proportional. Schibsted's tabular figures in particular are wide enough to read as code when used outside a column.

## 013. Reduced motion does not trust the library default

Measured in stage 1 with Motion 13.4: `MotionConfig reducedMotion` stops transform animations on ordinary elements but does not stop `layout` animations, despite the documentation. Rows still slid 300px under "always".

So the app decides for itself. `useShouldReduceMotion()` combines the in-app preference with the OS setting. Under reduced motion, lists turn layout animation off and fade the re-sorted list in instead, and sliding indicators move instantly. The in-app preference is also written to `data-motion` on `<html>` so the CSS tokens follow the same choice. It becomes a user setting in a later stage.

## 014. Controls commit on pointer-down

Segmented controls and the rating scale change value on `pointerdown`, not `click`. Buttons show their pressed state through `:active`, which applies on pointer-down; a no-op `touchstart` listener makes iOS Safari do the same. Keyboard activation still goes through `click`.

## 015. Next.js instruction-file generation is off

Next 16 writes coding-agent instruction files into the project root on `next dev` unless `agentRules: false` is set. They are noise in a hand-maintained repo, so generation is off.

## 016. Swiss chosen; Editorial removed

Chosen at stage 1 review because it reads as more deliberate and less generated. Supersedes the Editorial parts of 009, 011 and 012.

- One typeface, Schibsted Grotesk, at every size. Hierarchy comes from size, weight and tracking rather than a second family.
- Accent is steel (`#9db7d5`, 8.5:1 on the canvas). Brass and the two Editorial faces are gone from the code, along with the direction switch.
- Display size moved from 52px to 64px. With no serif to separate titles from interface text, scale contrast does that work.
- The motion switch stays on `/system` and becomes a user setting later.

## 017. Name: Parlour

Replaces the working name from 008. Parlour games are the ones people play together in the front room, and a parlour is a room for sitting and talking. That covers both halves of the app: a personal catalogue now, game clubs later. It points at games without sounding like gaming culture.

Rejected: Shelfmark (an iOS reading tracker with the same shelf model already uses it), Holdings (no connection to games), Couch Club (clear but expected, and "couch" names are crowded), Player Two (taken). Names that say "video game book club" outright clash with existing sites of that name. British spelling kept on purpose.

## 018. App shell

- A sticky header on a solid ground (no blur): wordmark, Library, Queue, Search, and "Add a game" as the one primary action. The current-page marker sits on the header's bottom edge and slides to the new item on navigation. On narrow screens the nav drops to a second row of full-width tabs; no hamburger menu for three items.
- A `template.tsx` wraps every page, so each navigation plays a short fade-and-rise (180ms, ease out; fade only under reduced motion). There are no exit animations: they would delay the next page.
- App pages title at 40px. The 64px display size is kept for the design system page and future editorial moments.
- The footer carries IGDB and IsThereAnyDeal attribution on every page, plus links to terms, privacy, data sources and the design system.
- Error boundaries receive `error`, `reset` and `retry` in the installed Next 16.3.6, although the docs describe `unstable_retry`. We use `retry`, which refreshes server data before re-rendering. `global-error.tsx` brings its own tokens and font, so even a root failure looks like Parlour.

## 019. Search before IGDB

The search page and form are real: the query lives in the URL, and `next/form` submits it as a client-side navigation. Until IGDB is connected (stage 5), a submitted search says plainly that search is not connected and that nothing was searched or saved. This is preferable to fake results or a disabled box.

## 020. Legal pages describe today, not the plan

Terms, privacy and data sources are written in plain language and state what is true now (nothing is stored), then list what will be stored once accounts exist. Each page shows an "updated" date kept in one file (`src/app/(legal)/updated.ts`). Whenever a stage starts storing or sharing something new, that stage updates these pages. They are not legal advice.

## 021. Mobile menu replaces the tab row

Revises 018 after review. Below 40rem the header is one row: wordmark, "Add a game", and a menu button. The button is a word plus two strokes, not a three-bar icon. On open the strokes rotate into a cross and the word changes from "Menu" to "Close", so the control always says what pressing it will do.

The panel drops from the header on the solid canvas (no scrim, no blur) and lists the three destinations at 32px, with the reference pages beneath. While it is open the page and footer are `inert` and the page does not scroll. Escape returns focus to the button; following a link closes it; widening the window past the breakpoint closes it. Under reduced motion the strokes snap and the panel only fades.

Also fixed at review: search inputs showed the browser's own clear button beside ours. The native one is hidden globally.

## 022. Database: Supabase, migrations in the repo, security in the database

- Hosted Supabase project `parlour` (Tokyo region, free tier), created at stage 3.
- Migrations are SQL files in `supabase/migrations`, applied in order and named by the version the database recorded. There's no local Docker stack, so they are applied to the hosted project directly; nothing is edited in the dashboard.
- Every personal table carries `user_id` and has row-level security from the migration that creates it: owners read and write their own rows, nobody else sees them, and signed-out visitors have no grants at all. Multi-user later means opening sign-up, not rewriting access.
- The shared catalogue (`games`, `platforms`) is readable by anyone and writable only by the server's service role. It is deliberately minimal until stage 4 reads the IGDB docs.
- Values that the app treats as fixed sets (progress, ownership) are `text` with check constraints, not Postgres enums, because enums are awkward to change.
- `entry_events` records every ownership, progress and rating change. Only a trigger writes it, so it can be trusted as history, and later it can feed an activity view without new plumbing.
- The queue orders by a fractional-index string with byte collation, so a move rewrites one row and sorts identically in Postgres and JavaScript.
- Trigger functions that bypass row-level security have `EXECUTE` revoked, after the Supabase security advisor flagged them as callable through the API.
- Access rules are tested with pgTAP (22 assertions: ownership, cross-user reads and writes, constraint enforcement, history integrity, signed-out access). The tests run in a rolled-back transaction, so they can run against the hosted project safely.

## 023. Sign-in by emailed link, invite-only

- Passwordless: `signInWithOtp` with `shouldCreateUser: false`. Accounts are created in the dashboard, and public sign-up is switched off there as well, because the app-level flag alone would not stop someone calling the API directly.
- An address without an account gets the same "check your email" response as one with an account, so the form does not reveal who has one.
- The emailed link opens a Parlour page with a "Sign in to Parlour" button, and the token is used only when it's pressed. Email security scanners open links automatically and would otherwise spend the one-time token before the person does.
- The confirm step accepts both link formats Supabase can send (`token_hash` and PKCE `code`), so it works before and after the email template is changed.
- The post-sign-in destination (`next`) is only ever a same-site path; anything else falls back to the library. This is tested against the usual open-redirect tricks.
- A Next.js proxy refreshes the session cookie on every request and never redirects; each page decides what signed-out visitors see. Because the header shows signed-in state, every page now renders per request rather than statically. That cost is fine for a personal app; if it matters later, the header can read the session on the client instead.
- The publishable key (`sb_publishable_...`) is used rather than the legacy anon key, as Supabase recommends for new projects.

## 024. Data layer narrows database strings

Rows arrive with `progress` and `ownership` as plain strings. `toLibraryEntry` converts them to the app's types and throws `UnexpectedDataError` on anything unknown. The database constraints make that impossible today, so if it ever fires, the schema and the app have drifted, and a loud failure is better than a wrong screen.

## 025. Email sending waits for launch

Supabase's built-in email sender only delivers to members of the project's team, is heavily rate-limited, and locks the email templates. For a single-user stage that is enough: the default Magic Link template sends a PKCE link, which the confirm page already handles, and it works in the browser that asked for it.

Before Parlour is public (stage 11), a custom email service (SMTP) is required anyway, since nobody outside the team would receive a link. The template then changes to the `token_hash` form so links work across devices. Until then, an address the built-in sender refuses gets a plain message on the sign-in form.

## 026. Navigation from the mobile menu

Found at stage 3 review: after tapping a page in the mobile menu, the menu faded out straight away, which uncovered the old page while the new one was still loading. The new page then faded in on top of it, so you briefly saw two pages and two fades.

Now the menu stays up until the new page has arrived, then disappears at once, and the page's own entrance is the only motion. The tapped item shows a small spinner if the wait is noticeable (after 80ms). On desktop, a tapped nav link shows a faint marker straight away, ahead of the real marker sliding over. Both use Next's `useLinkStatus`. Closing the menu by hand still animates.

## 027. Emailed links sign you in straight away

Revises 023 after review. The confirm page submits itself as soon as it loads, showing "Signing you in", so a link is one click, not two. With the default email template the one-time token is already spent at Supabase's own endpoint before the page loads, so the extra button protected nothing. Submitting from the page (rather than acting on the GET) still keeps link scanners that do not run scripts from spending a `token_hash` token once the template changes. The button remains as a fallback when JavaScript is off.

## 028. IGDB integration: shared token, rate limit, Postgres cache

- **Current field names only.** IGDB replaced several enums with lookup endpoints (`game_type`, `platform_type`, `date_format`, `release_region`, `external_game_source`). Queries use the new fields. The lookup tables are small and stable, so their ids are constants in `src/server/igdb/constants.ts` rather than extra requests.
- **One token for the app.** Twitch allows 25 live app tokens and disables the oldest beyond that, so the token lives in `provider_tokens` (service role only). It is read once per server instance, renewed a day before expiry, and replaced once if IGDB rejects it. If another instance has already renewed it, that token is reused rather than requesting a new one.
- **Rate limiting.** A per-instance limiter keeps to 4 requests per second and 8 in flight; waiting for a slot is event-driven, not polling. Several instances could still exceed the rate together, so the client also backs off on 429 (honouring `Retry-After`) and on 5xx and network errors, up to 4 attempts. It does not retry 4xx errors, which would fail the same way again.
- **Validated at the edge.** Every response is parsed with Zod before use; an unexpected shape is an error, not a crash three layers later.
- **Cache policy.** Searches are cached by normalised query for a day, empty results included. Games are refetched after 7 days (`stale_after`). If IGDB fails, an expired cached answer is served rather than an error; a game that was never stored is still an error.
- **Atomic writes.** A batch of games is written by `store_igdb_games(jsonb)` in one transaction. It replaces each game's related rows, so screenshots or platforms removed on IGDB do not linger. It runs with invoker rights, and only the service role may call it.
- **Search scope.** Search returns playable things: main games, standalone expansions, remakes, remasters, expanded games and ports. DLC, bundles, mods and updates are excluded, as are editions (`version_parent`), which would otherwise fill results with near-duplicates.
- **Data hygiene found in real responses.** Some titles start with a zero-width space, so text is cleaned before storage. A release date can name a platform the game's own list does not include; the date is kept and the platform link dropped. Year-only and quarter dates are never stored as a fake full date.
- **Where it runs.** The IGDB client, secrets and service-role client are marked `server-only`, so importing them into browser code fails the build.

## 029. Tests for external services

Offline tests use real IGDB responses saved as fixtures (Outer Wilds search, an unreleased game) plus fakes for the network and database. A separate `npm run test:live` suite runs the whole path against the real services with `.env.local`. It is not part of `npm test`, so the normal run never needs secrets or a network.

## 030. Search results and adding to the library

- **One block per game, one row per platform.** The cover, title, year, type and scores appear once, then each platform gets its own row with its own Add control or library status. You choose the exact version you play without the title repeating for every platform. Long platform lists flow into two columns on wide screens.
- **Ranking on top of IGDB.** IGDB orders by name similarity only, which put a 1995 _Hades_ with no ratings above the 2020 one. Results are re-ranked: exact titles, then titles starting with the search, then the rest; within each, more-rated games first; IGDB's order breaks remaining ties. The cache keeps IGDB's order, so the ranking can change without refetching.
- **Honest scores.** Critic scores need at least 3 reviews and player scores at least 10 ratings to appear, always with the count ("Critics 94 (17 reviews)"). Below that, nothing is shown.
- **Adding is optimistic.** Choosing Owned, Want to own or Not interested switches the row to "in library" at once, slightly dimmed until the server confirms. If the server refuses, the row reverts and says why. Focus moves to the new status, and a live region announces the addition. Adding something already in the library (from another tab) counts as success.
- **The server checks everything the browser sends.** The request is validated, the game is made sure of through the catalogue (fetched from IGDB only if missing or stale), the platform must be one the game is actually on, and the insert runs under the person's own session, so row-level security applies.
- **Signed out, search still works.** The catalogue is public; the Add control becomes "Sign in to add", which returns to the same search afterwards.
- **Loading keeps the form.** Results sit in a Suspense boundary keyed by the query, so a new search shows a skeleton of the results while the form stays put.

## 031. Search ranks a wide candidate set, not IGDB's first page

Found at stage 5 review: searching "pokemon" showed fan games and ROM hacks first. IGDB orders search results by name similarity only, and its first 20 for "pokemon" were almost all unrated fan projects. Pokémon Red, with 604 ratings, was at position 30 and never reached Parlour.

Search now works in three steps:

1. Ask IGDB for up to 200 matches, with only the fields ranking needs: name, total rating count, and hypes (follows before release).
2. Rank locally by `log10(1 + ratings + hypes)`, plus a boost for how well the title matches (exact +1, prefix +0.5, in powers of ten). A well-rated game always beats an unrated one, and an exact title only decides between games with similar followings.
3. Fetch full details for the best 40 in a single request, skipping any already stored and fresh.

The ranked list is cached for a day, so repeat searches cost nothing. For "pokemon" the first twelve are now all mainline games, led by Emerald, Red and FireRed. The ranking is tested against the real 161-result IGDB response.

## 032. Search results are a cover grid; ownership is editable in place

Revises 030 after review.

- **Cover grid.** Each card has the cover, title, full release date (or "Release date TBA"), a compact score, a platform picker and the action. Text sits in fixed-height slots, so controls line up across a row. Phones get two columns.
- **One compact score.** The player and critic averages are combined, each weighted by how many ratings it rests on, and shown as "86 (634)". It appears only with at least 10 ratings behind it; the full wording is in the tooltip and read out by screen readers.
- **Platform picker, not a row per platform.** One card per game with a platform select keeps the grid tidy. Platforms already in the library are marked in the picker, and "Also in your library on ..." notes other platforms. The picker starts on a platform already in the library, if any.
- **Ownership is editable after adding.** The Add control turns into an ownership picker ("✓ Owned") in the accent colour. Changing it is optimistic and reverts with a message if the server refuses. Progress ("Want to play") is no longer shown in search; that belongs to the library.
- **Sort.** Best match (the ranking above, default), Most rated, Newest, Oldest, Title. Undated games go last in both date orders. The choice is kept in the address without a server round trip, and cards travel to their new places; under reduced motion the grid fades into the new order instead.

## 033. Search card refinements from review

- **Default platform.** IGDB lists platforms in no useful order, so cards opened on Google Stadia or Mac. Platforms are now ordered, and the picker opens on the first:
  1. a platform you already have this game on;
  2. your own habit, once a platform has at least 3 games in your library (fewer is chance: one stray Xbox 360 entry should not steer every game);
  3. a fixed common-ownership order: PC, PS5, Switch, Switch 2, Xbox Series X|S, PS4, Xbox One;
  4. everything else by console generation, newest first;
  5. rarely owned ports and dead services last (Mac, Linux, iOS, Android, web, VR, Stadia).
- **Score colour.** 85 and up in the accent, 70 to 84 in plain text, below 70 in a muted clay (`--color-score-low`, 7.3:1 on the canvas). It is deliberately not the error coral: a low score is information, not a fault. The accent stays the only accent colour.
- **Alignment.** Card controls hang from the top instead of sitting at the bottom, so a card with an extra "Also in your library on..." note grows downwards without shifting its neighbours. A single platform is drawn as a quiet fixed field with the same box and text inset as the pickers beside it.
- **Sorting crossfades.** Changing sort fades the grid out (120ms, ease in) and back in, in its new order (180ms, ease out). On a 40-card grid, cards travelling 2,500px in 320ms read as a blur rather than a move. A literal blur filter was ruled out: filters are neither transform nor opacity, and blurring 40 cover images drops frames.

## 034. Library browsing

- **Filtering happens in the browser.** The page loads every entry in one query, and filters and sorts run locally. A personal library is hundreds of rows at most, so a keystroke in the title filter answers at once instead of after a round trip. If libraries ever reach thousands of entries, this moves to the server behind the same `LibraryViewState`.
- **The view lives in the address.** Layout, sort and filters are query parameters, written with `history.replaceState` (no navigation, no refetch) and read by the server on load, so a reload, the back button or a shared link opens the same view without flashing the default. Defaults are left out, so the plain library is just `/`.
- **Title filtering ignores accents, case and word order.** "pokemon" finds "Pokémon"; "zelda breath" finds "Breath of the Wild".
- **Progress filters are chips, and only for states you use.** A library with nothing abandoned shows no "Abandoned 0" chip. The chips are hidden when every entry shares one state, since one chip filters nothing. Ownership, platform and tag are selects, because their option lists grow; platform and tag only list values the library contains.
- **Motion.** List rows travel to their new places on sort and filter. The grid crossfades on a new sort (for the reasons in 033) and lets cards travel only when a filter closes gaps. Switching list and grid crossfades, since a row and a card share no shape to morph between. With reduced motion, or above `LAYOUT_ANIMATION_ITEM_LIMIT` (010), every change is a fade.
- **Rows and cards are not links yet.** `ListRow` and `GameCard` render as plain blocks without an `href`, with no hover or press state promising somewhere to go. Stage 7 (editing) gives them a destination.
- **"PC (Microsoft Windows)" is shown as "PC".** The IGDB name is too long for a list column, and nobody says it.

## 035. One animated dropdown everywhere

Found at stage 6 review: every other control moves, but native selects opened the system's own popup, which cannot be animated or styled. `Select` is now a labelled field around `MenuSelect`, the menu that already grows out of its trigger, so filters, sorts and platform pickers all open the same way.

- **What the native select gave for free is rebuilt:** arrow keys, Home and End, Escape, typing letters to jump to an option, and submitting with a form (a hidden input carries the value).
- **Menus stay on screen.** Before the first paint the menu measures itself, then opens upwards if there is more room above than below, and lines up with the trigger's other edge if it would run off the side. Long lists scroll inside the menu, capped at 22rem or 60% of the screen.
- **Long names no longer widen the control.** A native select sizes itself to its longest option, which stretched cards for games on the Super Nintendo Entertainment System. The trigger now keeps its container's width and ends a long name with an ellipsis; the menu shows it in full.
- **Trade-off:** phones no longer get the system's wheel or sheet picker. For lists this short, one consistent menu that shows where it came from is worth more.

## 036. Search results in a list as well as a grid

Search gets the same List/Grid toggle as the library, kept in the address as `view=list`; a new search keeps it. Grid stays the default, since search is where games are recognised by their covers. A new sort or layout crossfades, as in 033.

The card and the row share one hook and one set of controls, so adding works identically in both. What a search has done so far (games added, platforms picked by hand) now lives above the results. Before, changing the sort remounted every card and forgot a game added a moment earlier.

## 037. Editing an entry

- **A panel over the library, not a separate page.** Clicking a row or card slides a panel in from the right, over the library, which stays where you left it (filters, sort, scroll). The panel is a modal `<dialog>`, so focus stays inside, the page behind is inert and Escape closes it. It animates out before it is removed, and focus returns to the row that opened it. With reduced motion it fades instead of sliding.
- **The open entry is in the address** (`?entry=<id>`). Opening pushes a history entry, so Back closes the panel the way it would leave a page; a shared or reloaded link opens with the panel up. Rows and cards are real links, so opening one in a new tab also works.
- **Every field saves on its own, as you change it,** with no Save button. The change shows at once, in the panel and in the list behind, and the server confirms it behind that. If the server refuses, only that field goes back, unless something newer has changed it since, and the field says why. Notes save 0.8s after typing stops, on leaving the field, and when the panel closes.
- **Progress fills in dates, never over yours.** Moving to Playing sets the start date to today if it is empty; Finished or Completed does the same for the finish date. A date you typed is never overwritten, and a finish date is never put before a start date.
- **Tags are made by typing,** and matched to your existing tags regardless of case. Your other tags are offered below the field. Taking a tag off a game keeps the tag for use elsewhere.
- **Removing is the one change that waits.** It asks once, in place, says what goes with the entry, and waits for the server before the entry disappears, because it is the only edit that cannot be undone by changing it back.
- **No revalidation after edits.** The panel has already shown the change, and the library and search are rendered fresh on every visit. Revalidating also caused a bug: the router refresh it triggers put the old address back after an entry was removed.
- **The library heading and count moved into the client,** so removing a game updates the count, and the empty state appears when the last one goes.

## 038. Stage 7 review: a centred box, and progress that fits ownership

- **A box in the middle, not a side panel** (revises 037). The entry opens in a centred box that rises slightly and scales up as the page behind dims. It felt abrupt before because hiding the page scrollbar shifted everything sideways at the moment of opening; the scrollbar's space is now always reserved (`scrollbar-gutter: stable`), so nothing moves.
- **Progress only for games you own.** Progress is what you have done with your copy. "Want to own" keeps progress at "Want to play" (the field is shown but locked, with the reason). "Not interested" has no progress at all: the field is replaced by a line saying so, and those games show no progress in the library. Ownership options that would contradict the progress are shown but disabled, with the fix ("Set progress back to Want to play first"), rather than silently resetting progress. A check constraint in the database says the same. It was added `NOT VALID`, because one existing entry broke the rule, and the app never rewrites someone's data on its own: that entry keeps its values until it is next edited, and the box offers the fix.
- **Dates appear when they mean something:** the start date once a game is started, the finish date once it is finished or completed. The values are kept when hidden. A date is judged only when it is whole, with a year between 1950 and 2100. Browsers report each keystroke of a year as a date ("0002", "0020", "0202"), and checking those refused a finish date before its year was typed.
- **Tags on a game and your other tags look different.** Tags on the game are in the accent with a ×; your other tags are dashed with a +. "Manage tags" lists every tag with a delete control. Deleting asks first, naming the games that will lose the tag, and waits for the server, as removing a game does.
- **Tags show in the library,** as small labels after the year and platform in the list and under the facts on a card. The list's Added column is gone; sorting by date added stays.
- **"Remove from library" is a red outlined button,** not quiet text.
- **The library and search remember you,** in cookies so the server draws the right thing first with no flash. The library keeps its layout and order (filters are for the moment). Search keeps the last query, sort and layout, and going to Search from the menu or "Add a game" returns to it. Submitting an empty search forgets it. An address that sets these always wins, so shared links show what was shared.
- **Dropdowns unfold from their box.** The menu sits 2px under its trigger and stretches down out of it, and its choices fade in once it has room, so the stretch never shows on the text.
- **Search list covers are 4.5rem wide,** big enough to recognise, and each row is centred vertically.

## 039. Dates are offered, not asked for; filters fold away on phones

- **Start and finish dates are opt-in** (revises 037 and 038). Progress no longer fills in today's date, and the date fields stay hidden until a date exists or you choose "Add when you started" (or "...and finished"). Filling in a whole library should never feel like it needs dates for every game.
- **On phones, the library toolbar is two rows:** the title filter, then a Filters button next to the List/Grid switch. The button shows how many filters are active, and opens a "Filter and sort" box with the progress chips, the ownership, platform and tag filters, the sort, and a "Show N games" button that reports what the filters leave. From 48rem everything is back inline, and an open box closes itself if the window widens past that point.

## 040. The game page

- **A catalogue record at `/games/[slug]`,** with IGDB's slug as the address, so links read well and survive a refetch. A stored game is served from Postgres (refreshed when stale); a game never stored, from an old bookmark or a shared link, is fetched from IGDB by slug. Anything that is not a slug is refused before any request, and an unknown game is a 404. The page is public: the catalogue has no personal data, and only the library panel needs you signed in.
- **Layout.** Cover and "Your library" on the left (sticky from 60rem), the record on the right: title, first release date and genres, then scores, summary, releases, images, trailers and links. On phones the cover sits beside the library panel, so the title is on the first screen.
- **Scores are shown separately here.** Players and critics each get their own figure and count, since there is room to show both honestly; search keeps the single combined figure (033). The 030 thresholds apply: at least 10 player ratings, 3 critic reviews. Below that the page says "Only 2 reviews so far" instead of a number.
- **Your library on the page** lists an entry for each platform you have the game on, and each opens in the library's editor (`/?entry=`). Below them are the same platform picker and add button as search, from the same code.
- **Releases** show each platform's first release. The full table, one line per platform and date with the regions that shared it, is one press away, because a big release can have twenty dates. Dates are only as exact as IGDB knows them ("Q3 2026", "2017", "TBA").
- **Images:** six frames, the last showing how many more there are. Any frame opens a wide viewer that steps through all of them with buttons or arrow keys, crossfading in place.
- **Trailers load nothing from YouTube until played.** Each shows one of the game's IGDB images as a poster. Pressing play swaps in the youtube-nocookie player, as the privacy page promises. Two are shown, with the rest a press away.
- **Guides are searches, not guessed pages:** YouTube walkthroughs, GameFAQs and HowLongToBeat, all searched by name. A search always lands somewhere useful; a guessed address often doesn't. Steam gets a store link because its id makes a real address. GOG and Epic ids don't, so they wait for prices in stage 9.
- **Getting there:** search cards and rows link their title and cover (one keyboard stop per game), and the entry editor has a "Game page" link.

## 041. Stage 8 review

- **Dates can be removed:** each field has a clear control, and "Remove dates" clears both and folds the fields away. "Add dates" sits directly under progress, as a small outlined button, rather than in a section of its own.
- **"Add to library" is a button that opens a menu.** In action mode the trigger is filled, centred, with a plus sign and no chevron. It still opens the ownership choices, because adding needs that one answer, but it reads as the command it is.
- **Pictures fit the screen.** The viewer's frame is capped at 70% of the screen height, and each picture is drawn whole inside it, never cropped or spilling out, with the page visible around the box to click away. The frame's grid track is now definite: without that, the height limit silently did nothing, which is what made pictures look zoomed in.
- **Trailers open in the same large box** as pictures, sized to 16:9 within the screen, and YouTube still loads only on play.
- **Genres are boxed labels,** so they never read as part of the release date.
- **Missing critic scores say why.** IGDB's critic data is thin for older games: Ocarina of Time has none, A Link to the Past has one review. Parlour does not invent or borrow a number. It says "No reviews on IGDB" or "Only 1 review on IGDB" and links a Metacritic search. A second score source could fill this properly later; it would need its own licence and API key.
- **Your library on the game page shows what you recorded:** rating, progress and ownership, dates, tags and the first few lines of your notes, with "Edit in your library".
