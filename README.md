# ChartForge

B2B chart studio: 56 exhibit types, live data sheet, native PowerPoint export.

Production: **Railway** serves the app. **Supabase** handles login, logout, and deck storage.

## Railway (production)

1. Create a [Supabase](https://supabase.com) project.
2. Authentication → Providers → **Email** on. For faster first login, turn **Confirm email** off (or keep it on and add your Railway URL under Authentication → URL Configuration).
3. SQL editor → run [`supabase/schema.sql`](supabase/schema.sql).
4. Settings → API → copy **Project URL** and **anon public** key.
5. [Deploy from GitHub on Railway](https://railway.com/new) → this repo (`prakharsingh1/chart-forge`), branch `main` or `cursor/thinkcell-ai-charts-dad9`.
6. Service → Variables:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Railway already sets `PORT`. Keys are read at **runtime** from `/config.js` — set them, then **restart** the service (no rebuild required).

7. Settings → Networking → Generate domain.
8. In Supabase: Authentication → URL Configuration → Site URL = `https://YOUR-APP.up.railway.app` and Redirect URLs = `https://YOUR-APP.up.railway.app/**`.

Open the Railway URL. **Log in / Sign up** in the top bar. Decks autosave to the `decks` table (RLS: you only see your rows). **Log out** clears the session.

## Local

```bash
cp .env.example .env
# paste VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://127.0.0.1:5178/
