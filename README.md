# ChartForge

B2B chart studio: 56 exhibit types, live data sheet, native PowerPoint export. Auth and deck storage on **Supabase**. Production host on **Railway**.

## Local

```bash
cp .env.example .env
# paste VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open http://127.0.0.1:5178/

## Supabase (once)

1. Create a project at [supabase.com](https://supabase.com)
2. Authentication → Providers → Email on
3. SQL editor → run `supabase/schema.sql`
4. Settings → API → copy **Project URL** and **anon public** key

## Railway

1. New project → Deploy from GitHub (`chart-forge`, branch `cursor/thinkcell-ai-charts-dad9` or `main`)
2. Variables (must be available at **build** time):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
PORT=8080
```

3. Generate domain. The Dockerfile builds the Vite app (bakes in those keys) and `node server/index.js` serves it.

Log in / sign up in the product. Decks autosave to the `decks` table (RLS: you only see your rows). Log out from the top bar.
