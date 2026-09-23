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
3. **Emails, Magic Link template**: link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`. This makes links work when opened on a different device, and survive email security scanners.
4. **Users**: create each account with "Add user". There is no public sign-up.
