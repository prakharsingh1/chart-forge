# ChartForge

Production: https://chart-forge.up.railway.app

Auth and deck storage: Supabase project `wrlxmrzjdxkpdbcutgxv`. The publishable key is baked into `/config.js` (safe to expose; RLS protects rows).

## One-time database setup

The API key works; the `decks` table is not created yet. In the [SQL editor](https://supabase.com/dashboard/project/wrlxmrzjdxkpdbcutgxv/sql/new) paste and run [`supabase/schema.sql`](supabase/schema.sql).

Then: Authentication → URL Configuration

- Site URL: `https://chart-forge.up.railway.app`
- Redirect URLs: `https://chart-forge.up.railway.app/**`

Email confirmation is on, so new accounts must click the mail before login. Turn Confirm email off if you want instant sign-in.

Railway project: [courteous-manifestation](https://railway.com/project/29e1101f-615c-4620-b954-6ff7dfdc5fb0). Domain: https://chart-forge.up.railway.app

If a GitHub push does not rebuild, in Railway press **Cmd/Ctrl+K → Deploy Latest Commit** (connected branch: `main`).
