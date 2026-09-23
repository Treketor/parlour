# Parlour

A catalogue of the games I own, have played and want to play next, with monthly game clubs planned for later.

Status: early development. See [PROGRESS.md](PROGRESS.md) for where things stand and [DECISIONS.md](DECISIONS.md) for why they are the way they are.

## Running locally

Requires Node 22.12 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Configuration

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key (Project Settings, API). Both are safe to expose: the database only returns what row-level security allows.

## Database

The schema lives in `supabase/migrations`, one SQL file per change, named by the version the database recorded when it was applied. The files are the source of truth; nothing is changed in the dashboard.

- **Access rules** are tested in `supabase/tests/database`. With Docker, `npx supabase test db` runs them against a local copy. Without it, paste the file into the SQL editor of any Supabase project: it runs inside a transaction that rolls back, and prints only a failure summary if something breaks.
- **Types** in `src/lib/supabase/database.types.ts` are generated from the live schema. Regenerate them after every migration (`npx supabase gen types typescript --project-id <ref>`).

### Sign-in settings

Sign-in is by emailed link, and accounts are invite-only. These are set in the Supabase dashboard, under Authentication:

1. **Sign In / Providers**: turn off "Allow new users to sign up".
2. **URL Configuration**: add `http://localhost:3000/**` (and the production URL, once deployed) to the redirect URLs.
3. **Users**: create each account with "Add user". There is no public sign-up.

Until a custom email service (SMTP) is configured, Supabase only sends sign-in emails to members of the project's team, a few per hour, and the email template cannot be edited. Links then work only in the browser that asked for them. Before Parlour is public, set up custom SMTP and change the Magic Link template to link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`, which makes links work on any device.

## Game data (IGDB)

Game data comes from IGDB through a server-side client in `src/server/igdb`. It needs a Twitch app (see `.env.example`), and the Supabase secret key to write the shared catalogue.

- One IGDB token is shared by the whole app and stored in `provider_tokens`. Twitch disables the oldest tokens once an app has 25, so a token per request or per server would eventually break.
- Requests stay under IGDB's limits (4 per second, 8 at once) and back off on 429s.
- Everything fetched is cached in Postgres: searches for a day, games for a week.

`npm test` runs offline against saved IGDB responses in `src/server/igdb/fixtures`. `npm run test:live` runs the end-to-end check against the real IGDB and Supabase using `.env.local`.
