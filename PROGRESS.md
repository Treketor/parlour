# Progress

## Stage plan

1. Design and motion system (done)
2. App shell, routing, empty, error and legal pages (done)
3. Database schema, row-level security, auth (done)
4. IGDB integration: proxy, token and rate handling, catalogue cache (done)
5. Search and add to library (done)
6. Library browsing: list and grid, filter and sort (done)
7. Library entry editing: progress, ownership, rating, tags, notes (done)
8. Game detail page: media, release info, scores, trailers, walkthrough links (done)
9. Prices: IsThereAnyDeal matching, current prices, history chart (done)
10. Play queue (done)
11. Accessibility, performance and reduced-motion pass; README screenshots; deploy (deploy in progress)

## Done

- Scaffold: Next.js 16, strict TypeScript, ESLint, Prettier, Vitest.
- Named Parlour (DECISIONS.md 017).
- Stage 1: tokens (colour, type, space, edges, motion), base components with their states, and the `/system` review page. Swiss direction chosen at review; Editorial removed. `/` redirects to `/system` until stage 2.
  - Components: Button, IconButton, Spinner, TextField, Select, Checkbox, SegmentedControl, MenuSelect, RatingInput, Tag, ProgressGlyph, GameCover, GameCard, CatalogueList, ListHeader, ListRow, Skeleton, Notice.
  - Logic with tests: rating keyboard and pointer model, catalogue sorting, date formatting, motion token parity (41 tests).
- Stage 2: app shell (44 tests; header with sliding current-page marker, footer with attribution, skip link, page entrance), Library and Queue empty states, Search page and form, 404, error and root error pages, Terms, Privacy and Data sources. Home is now the Library; `/system` sits inside the shell and is linked from the footer. After review: a mobile menu replaced the tab row, and the doubled clear button in search is fixed.

- Stage 3: Supabase project, schema (profiles, per-platform library entries, tags, queue, change history, minimal catalogue), row-level security with 22 pgTAP access tests, generated types, data layer, emailed-link sign-in with a scanner-proof confirm page, sign-out, signed-out states for Library and Queue, loading skeletons, privacy page updated for accounts. 69 unit tests. After review: mobile menu navigation no longer shows two pages at once, and nav links show pending feedback; emailed links sign you in without a second click.

- Stage 4: IGDB client (shared stored token, rate limiter, retries, validated responses), catalogue tables for summaries, scores with counts, genres, per-platform release dates, media, trailers and store ids, atomic batch writes, search cache, and `searchCatalogue` / `ensure` for stage 5. 12 more pgTAP access tests, 4 live end-to-end tests, 125 unit tests. No UI yet: search is wired up in stage 5.

- Stage 5: search in a cover grid, with a platform picker, compact score and add or ownership change on each card; ranking over up to 200 IGDB candidates so official games lead; five sort orders; signed-out, empty, too-short and IGDB-failure states; results skeleton. After review: smarter default platform, score colour bands, aligned card controls, sort crossfade. 175 unit tests, 4 live tests.

- Stage 6: library browsing in a list or cover grid; filter by title (accent- and order-insensitive), progress, ownership, platform and tag; five sorts plus sortable list columns; the whole view kept in the address; animated reordering with crossfades for new orders, layout switches and reduced motion; a filtered-empty state and a loading skeleton that matches the toolbar and list.

- Stage 6 review: every dropdown is now the app's own animated menu (it stays on screen, supports typeahead and truncates long names); search results can be shown as a list.

- Stage 7 second review: dates are opt-in (no automatic filling); on phones the library filters and sort fold into a Filters box.

- Stage 7 review: the entry opens in a centred box; progress, dates and ownership follow each other (with a database check); tags look different on and off a game, show in the library, and can be deleted with a warning; the library and search remember their layout and last search; dropdowns unfold from their box; larger search list covers.

- Stage 7: an entry panel over the library, opened from any row or card and kept in the address; progress, ownership, rating, start and finish dates, tags and notes, each saved as it changes and rolled back with a reason if refused; start and finish dates filled in from progress when empty; removing an entry with an in-place confirmation.

- Stage 8 second review: scores from Metacritic (via RAWG, needs RAWG_API_KEY), Steam and IGDB, most credible first, cached weekly; unreleased games say so; Show all and Show fewer for images and trailers; "Not interested" removed from Add to library.

- Stage 8 review: dates can be cleared or removed; "Add to library" drawn as a button; pictures fit the screen in the viewer; trailers open large; boxed genres; missing critic scores explained with a Metacritic search; your entry's rating, dates, tags and notes on the game page.

- Stage 8: a public game page at /games/[slug]: cover, genres, separate player and critic scores with counts, summary, releases per platform (all regional dates on request), an image grid with a wide stepping viewer, trailers that load YouTube only when played, guide searches and a Steam link, and your entries plus the add controls. Reached from search titles and covers and the entry editor.

- Stage 9: prices from IsThereAnyDeal on the game page: best price now, lowest ever and this year, a year of price history, every shop; per region with a picker (saved on your profile, or on the device); cached six hours, served stale if ITAD is down.

- Stage 9 review: footer credits every source; pictures hover like covers; search leads with Metacritic when known, topping up after each search; a Covers library layout and covers per row.

- Stage 10: the play queue: add from the entry editor (play next or at the end), reorder by dragging or from the keyboard with announcements, remove, and finished games leave the queue on their own.

- Stage 10 review: sort by platform with headings; a one-row library toolbar with a Filters panel; a sectioned entry editor; one-press queueing; queue rows drag from anywhere.

- Stage 11: the search list became a catalogue table. axe audit of every page and open state, fixing busy buttons without a name, unreachable tag suggestions and focus lost after the editor closed. Responsive WebP covers, eager first results, no footer shift. README with screenshots. Functions pinned to Tokyo, next to the database.

## Next

- Deploy: import the repo in Vercel, add the environment variables, add the production URL to Supabase's redirect URLs.
- Custom SMTP (Resend suggested) once there is a domain, then the Magic Link template change in the README.

## Later

- Search filters: released games only, a release-year range, platform. Suggested at stage 5 review; the library filters in stage 6 come first.
- OpenCritic as a further critic source (its API is sold through RapidAPI). Considered at stage 8 review.
- Written reviews: a few lines alongside the 1 to 10 rating, to explain it. Suggested at stage 7 review.

## Known issues

- Until custom SMTP is set up (before launch), sign-in emails only reach Supabase team members, and links only work in the browser that asked for them.
- The browser logs a warning about an unused preloaded stylesheet a few seconds after load. It comes from Next prefetching the Design system page linked in the footer, and it is harmless.
- Progress glyphs are 12px. The paused mark is the least legible at that size; accepted at review as still distinguishable.
