# Signal

Open-source, self-hostable LinkedIn analytics. A privacy-first Shield alternative.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=REPLACE_WITH_REPO_URL)

> **Note:** Replace `REPLACE_WITH_REPO_URL` in the deploy button above with your GitHub repo URL after pushing.

---

## Set up with your AI agent

If you use Claude Code, Cursor, or Codex, you can have your agent do almost all of the setup for you. Copy the prompt below and paste it into your agent:

```
Clone https://github.com/<your-org>/signal, then follow AGENTS.md to set it up
for me. Do everything you can via CLI and ask me only when you need a browser
login or a manual Chrome extension step.
```

Replace `<your-org>/signal` with the actual GitHub URL after you push this repo. The agent will handle dependency install, Supabase project creation, schema migrations, env vars, and optionally a Vercel deploy — stopping only to ask you for a browser login, a DB password choice, or a region selection.

---

## Why

Shield Analytics is winding down. Signal is the self-hosted replacement — built on file imports (bring your own data), so there is no scraping, no ToS risk, and no third-party servers touching your data. You connect your own Supabase project; your analytics live there and nowhere else.

---

## Features

- **Multi-profile dashboard** — one deploy tracks multiple LinkedIn profiles. Built for ghostwriters and agencies managing clients.
- **Four views** — Overview, Posts, Audience, Health.
- **Shield CSV import** — drop in your full historical export from Shield before it goes dark.
- **LinkedIn official XLSX import** — LinkedIn's own creator-analytics export (up to 365 days). No scraping.
- **Magic-link auth** — Supabase email magic links. No passwords.
- **Fully self-hostable** — deploy to Vercel or run locally. Your Supabase, your data.
- **Signup lock** — set `SIGNAL_LOCK_SIGNUPS=true` to close registration after the owner signs up, keeping your instance private.

---

## Self-host in ~10 minutes

1. **Create a free Supabase project** at [supabase.com](https://supabase.com). Copy your project ref, URL, and anon key from the project's API settings.

2. **Clone this repo and install dependencies.**
   ```bash
   git clone https://github.com/YOUR_USERNAME/signal.git
   cd signal
   npm install
   ```

3. **Apply the database schema.**
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   This creates the tables and Row-Level Security policies from `supabase/migrations/0001_init.sql`.

4. **Configure environment variables.**
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

   # Optional: set to true to disable new signups after you register
   SIGNAL_LOCK_SIGNUPS=true
   ```

5. **Deploy or run locally.**
   - **Vercel:** click the Deploy button at the top of this README and paste your env vars into the Vercel project settings.
   - **Local:** `npm run dev` — open [http://localhost:3000](http://localhost:3000).

6. **Sign in, create a profile, and import your data.**
   Use the magic-link flow to authenticate, create a LinkedIn profile, then head to `/import` to upload your files.

---

## Getting your data

**Shield CSV**
In Shield, open the dashboard and click the CSV export option next to the time-period selector. Do this before Shield shuts down — historical post data is not recoverable from LinkedIn alone.

**LinkedIn XLSX**
LinkedIn → your profile → Settings → Analytics → Export post analytics. LinkedIn allows exports up to 365 days. The file arrives as an `.xlsx`.

---

## Importing

1. Go to `/import`.
2. Select the source: **Shield CSV** or **LinkedIn XLSX**.
3. Choose the profile to import into.
4. Upload the file. Signal processes it client-side and writes records to your Supabase database.

---

## Roadmap

- **Passive capture browser extension** — optional add-on for live data without manual exports (planned, not in this version).
- **Audience demographics** — follower industry, location, and seniority breakdowns.
- **Follower-growth tracking** — historical follower counts over time.

---

## Privacy

Signal is import-based. There is no scraping, no browser automation against LinkedIn, and no external API calls for your data. When you self-host, every record lives in the Supabase project you created — no data ever touches this project's infrastructure or anyone else's.

---

## License

MIT — see [LICENSE](./LICENSE).
