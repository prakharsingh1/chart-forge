# ChartForge

Production: https://chart-forge.up.railway.app

Auth and deck storage: Supabase project `wrlxmrzjdxkpdbcutgxv`. The publishable key is baked into `/config.js` (safe to expose; RLS protects rows).

## One-time database setup

The API key works; the `decks` table is not created yet. In the [SQL editor](https://supabase.com/dashboard/project/wrlxmrzjdxkpdbcutgxv/sql/new) paste and run [`supabase/schema.sql`](supabase/schema.sql).

Then: Authentication → URL Configuration

- Site URL: `https://chart-forge.up.railway.app`
- Redirect URLs: `https://chart-forge.up.railway.app/**`

Email confirmation is on, so new accounts must click the mail before login. Turn Confirm email off if you want instant sign-in.

Railway is connected to GitHub `main`. Pushing `main` redeploys the site.
