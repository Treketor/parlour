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

| Token | Value | Use |
|---|---|---|
| `ease-out` | cubic-bezier(0.22, 1, 0.36, 1) | Anything responding to input or entering. Fast start reads as immediate. |
| `ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | Things travelling between two resting places (reorders). |
| `ease-in` | cubic-bezier(0.55, 0, 1, 0.45) | Exits: accelerate out of the way. |
| `press` | 70ms | Release of a pressed state. Press itself applies with no transition. |
| `fast` | 120ms | Hover, colour changes, exits. |
| `base` | 180ms | Popovers, small reveals. |
| `slow` | 240ms | Indicators sliding between options. |
| `spatial` | 320ms | Rows moving to new positions. |

Only `transform` and `opacity` animate. Hover changes colour only; nothing lifts or grows on hover.

Reduced motion is a real variant rather than an off switch. Distances and press scale collapse to zero, long durations shorten, and state changes still crossfade so the change remains visible. Motion's `reducedMotion="user"` does the same for JS animations: it drops transform and layout animation and keeps opacity.

Layout animation on reorder is limited to lists of 100 visible items or fewer. Past that, measuring every row costs frames, and the list crossfades instead.

Tokens live in `tokens.css`; `src/lib/motion.ts` mirrors them for Motion, and a test fails if the two drift.

## 011. Colour

Warm near-black ground (`#1a1917`) with surfaces stepped up in lightness instead of shadows. The Editorial direction uses a brass accent (`#c8a565`), taken from the label frames on card-catalogue drawers. Swiss uses a cool steel (`#9db7d5`). The accent marks only current, selected and focused things, plus the primary action.

Progress states do not get a colour each, which would turn into a rainbow. They get small drawn glyphs and a text label; only "playing" uses the accent. The error colour is a muted coral and appears nowhere else.

Measured contrast against the canvas: body 14.0:1, muted 8.7:1, faint 6.0:1, brass 7.6:1, steel 8.5:1, error 7.0:1. Faint text stays above 4.5:1 on every surface step, down to the pressed fill. Control edges use a separate `control-line` token at 3.3:1, because WCAG 1.4.11 needs input boundaries at 3:1 and the decorative hairlines are deliberately much quieter.
