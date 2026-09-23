# Progress

## Stage plan

1. Design and motion system (done)
2. App shell, routing, empty, error and legal pages (done)
3. Database schema, row-level security, auth (done)
4. IGDB integration: proxy, token and rate handling, catalogue cache
5. Search and add to library
6. Library browsing: list and grid, filter and sort
7. Library entry editing: progress, ownership, rating, tags, notes
8. Game detail page: media, release info, scores, trailers, walkthrough links
9. Prices: IsThereAnyDeal matching, current prices, history chart
10. Play queue
11. Accessibility, performance and reduced-motion pass; README screenshots; deploy

## Done

- Scaffold: Next.js 16, strict TypeScript, ESLint, Prettier, Vitest.
- Named Parlour (DECISIONS.md 017).
- Stage 1: tokens (colour, type, space, edges, motion), base components with their states, and the `/system` review page. Swiss direction chosen at review; Editorial removed. `/` redirects to `/system` until stage 2.
  - Components: Button, IconButton, Spinner, TextField, Select, Checkbox, SegmentedControl, MenuSelect, RatingInput, Tag, ProgressGlyph, GameCover, GameCard, CatalogueList, ListHeader, ListRow, Skeleton, Notice.
  - Logic with tests: rating keyboard and pointer model, catalogue sorting, date formatting, motion token parity (41 tests).
- Stage 2: app shell (44 tests; header with sliding current-page marker, footer with attribution, skip link, page entrance), Library and Queue empty states, Search page and form, 404, error and root error pages, Terms, Privacy and Data sources. Home is now the Library; `/system` sits inside the shell and is linked from the footer. After review: a mobile menu replaced the tab row, and the doubled clear button in search is fixed.

- Stage 3: Supabase project, schema (profiles, per-platform library entries, tags, queue, change history, minimal catalogue), row-level security with 22 pgTAP access tests, generated types, data layer, emailed-link sign-in with a scanner-proof confirm page, sign-out, signed-out states for Library and Queue, loading skeletons, privacy page updated for accounts. 69 unit tests. After review: mobile menu navigation no longer shows two pages at once, and nav links show pending feedback; emailed links sign you in without a second click.

## Next

- Stage 4: IGDB integration.

## Known issues

- Until custom SMTP is set up (before launch), sign-in emails only reach Supabase team members, and links only work in the browser that asked for them.

- Search says it is not connected when a query is submitted; replaced by real results in stage 5.
- The browser logs a warning about an unused preloaded stylesheet a few seconds after load. It comes from Next prefetching the Design system page linked in the footer, and it is harmless.
- Cover art is the designed no-art state everywhere; real art arrives with IGDB in stage 4.
- Progress glyphs are 12px. The paused mark is the least legible at that size; accepted at review as still distinguishable.
