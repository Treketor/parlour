# Progress

## Stage plan

1. Design and motion system (awaiting review)
2. App shell, routing, empty, error and legal pages
3. Database schema, row-level security, auth
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
- Stage 1: tokens (colour, type, space, edges, motion), two visual directions, base components with their states, and the `/system` review page. `/` redirects to `/system` until stage 2.
  - Components: Button, IconButton, Spinner, TextField, Select, Checkbox, SegmentedControl, MenuSelect, RatingInput, Tag, ProgressGlyph, GameCover, GameCard, CatalogueList, ListHeader, ListRow, Skeleton, Notice.
  - Logic with tests: rating keyboard and pointer model, catalogue sorting, date formatting, motion token parity (41 tests).

## Next

- Choose Editorial or Swiss on `/system`, then delete the other direction and the review switches.
- Stage 2: app shell.

## Known issues

- Cover art is the designed no-art state everywhere; real art arrives with IGDB in stage 4.
- The direction switch applies after hydration, so a stored "Swiss" choice flashes Editorial for a frame on load. Review-only; removed with the switch.
- Progress glyphs are 12px. The paused mark (two bars in a ring) is the least legible at that size; worth a second look at review.
- Public Sans at 13px on standard-density screens reads slightly mechanical in faint text. Visible on the card metadata line.
