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
