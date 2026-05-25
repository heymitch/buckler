<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Signal — Agent Setup Runbook

## You are setting up Signal

Signal is an open-source, self-hostable LinkedIn analytics dashboard (Next.js + Supabase). Users bring their own data via file import; nothing touches external servers.

---

## What you cannot do (set expectations first)

Tell the user up front that these steps require their direct action — you will stop and wait:

- **Supabase login** — opens a browser tab; the user must click "Authorize".
- **Supabase project creation** — requires choosing a DB password and region; ask the user for both before running the command.
- **Vercel auth / deploy** — `vercel login` opens a browser; Vercel project creation requires a decision on team/scope.
- **Magic-link sign-in** — after deploying the app, the user must open the email and click the link themselves.
- **Chrome extension install** — loading an unpacked extension at `chrome://extensions` is a manual browser action.
- **Extension popup config** — pasting the ingest URL + token into the extension popup is a manual action.

Never guess passwords, never commit `.env.local`, never skip a human step silently.

---

## Ground rules

- Do as much as possible via CLI. Use `npx supabase` (already installed in the repo) for all Supabase operations.
- STOP and ask the user — do not invent values — for: Supabase credentials/passwords, region choice, org selection, Vercel scope.
- Never write secrets to files that are tracked by git. `.env.local` is in `.gitignore`; confirm before writing.
- Prefer `--yes` flags only on non-destructive commands (installs, reads). Never auto-confirm destructive operations.
- After every major CLI step, check the exit code and surface any error to the user before proceeding.

---

## Steps

### 1. Preflight

```bash
node --version          # must be >= 18
npm install
npm run build           # expect: compiled successfully, no type errors
npm run test            # expect: 8 passed (4 test files)
```

**Expected:** build exits 0, test run shows `Tests  8 passed (8)`.

If node is below 18, stop and ask the user to upgrade before continuing.

---

### 2. Supabase setup

#### 2a. Authenticate

```bash
npx supabase login
```

**Human required.** A browser tab will open. Tell the user to click "Authorize" and return to the terminal. Wait for `Finished supabase login` in stdout.

#### 2b. Create a project (skip if linking an existing one)

Ask the user:
1. "What should the project be named?" (e.g. `signal`)
2. "Choose a database password — use a strong one (16+ chars). You will need this again if prompted."
3. "Choose a region closest to you." Available regions: `us-east-1`, `us-west-2`, `eu-west-1`, `eu-central-1`, `ap-southeast-1`, `ap-northeast-1`, and others. Run `npx supabase projects create --help` to see the full list.

First, list orgs to get the org ID:

```bash
npx supabase orgs list
```

Copy the `ID` column value for the org the user wants. Then create the project:

```bash
npx supabase projects create <name> \
  --org-id <org-id> \
  --db-password "<db-password>" \
  --region <region>
```

**Expected:** output includes `Project ref:` — save that value as `<project-ref>`.

If the user already has a Supabase project, ask them for the `<project-ref>` from their dashboard (Settings → General) and skip to 2c.

#### 2c. Link the project

```bash
npx supabase link --project-ref <project-ref>
```

If prompted for the database password, use the one from 2b.

**Expected:** `Finished supabase link.`

#### 2d. Apply migrations (5 tables + RLS + ingest tokens)

```bash
npx supabase db push
```

This applies both migrations in order:
- `supabase/migrations/0001_init.sql` — creates tables `profiles`, `posts`, `follower_snapshots`, `audience_demographics`, `imports` with Row-Level Security policies.
- `supabase/migrations/0002_ingest_tokens.sql` — adds the `ingest_tokens` table used by the optional capture extension.

**Expected:** `Finished supabase db push.`

If any migration fails, surface the full error to the user and do not retry without understanding the cause.

#### 2e. Retrieve the anon key and project URL

```bash
npx supabase projects api-keys --project-ref <project-ref>
```

**Expected:** a table listing keys including `anon`. Copy the `anon` key value.

The project URL is always: `https://<project-ref>.supabase.co`

#### 2f. (Optional) Deploy the ingest edge function

*Only required if the user wants the browser capture extension (step 8). Skip otherwise.*

```bash
npx supabase functions deploy ingest
```

**Expected:** `Deployed Function ingest on project <project-ref>.`

> **Note:** Supabase auto-injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` into deployed edge functions — no manual secret configuration needed.

---

### 3. Write `.env.local`

`.env.local` is gitignored — safe to write secrets here.

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-step-2e>

# Set to "true" to disable new signups after the owner registers (private instance)
SIGNAL_LOCK_SIGNUPS=false
```

Ask the user: "Do you want to lock signups so only you can use this instance? (yes/no)". If yes, set `SIGNAL_LOCK_SIGNUPS=true`.

Verify the file was written and contains both `NEXT_PUBLIC_` vars before continuing.

---

### 4. Run locally or deploy to Vercel

#### Option A — Local dev

```bash
npm run dev
```

**Expected:** `Local:  http://localhost:3000` in stdout. Open that URL.

#### Option B — Deploy to Vercel

**Human required for auth.** Tell the user: "I need to authenticate with Vercel. A browser will open."

```bash
npx vercel login
```

Then deploy:

```bash
npx vercel --prod
```

When Vercel prompts for project name and team/scope, answer based on what the user tells you. When it asks for environment variables, add the three vars from `.env.local`.

After deploy, note the production URL — the user will need it for sign-in.

---

### 5. First sign-in (human)

Tell the user:

> Open the app (local: http://localhost:3000 or your Vercel URL). On the login page, enter your email and click "Send magic link". Check your inbox and click the link. You'll be redirected back and signed in.

The agent cannot click the email link. Wait for the user to confirm they are logged in before continuing.

---

### 6. Create a profile and import data

Once signed in, guide the user to:

1. Go to `/import`.
2. Click "New profile" and enter the LinkedIn profile name to track.
3. Select the data source and upload the file:
   - **Shield CSV** — from Shield's dashboard: click the CSV export button next to the time-period selector. Download this before Shield shuts down — historical post data is not recoverable from LinkedIn alone.
   - **LinkedIn XLSX** — from LinkedIn: Profile → Settings → Analytics → Export post analytics. Choose up to 365 days. The file arrives as `.xlsx`.
4. Click "Import".

**Expected:** a success toast showing the number of rows imported. The dashboard at `/signal` should now show data.

---

### 7. (Optional) Load demo data

To preview the dashboard with sample records before importing real exports, run the seed file against your remote DB. Open the Supabase SQL editor in the dashboard (project → SQL Editor), paste the contents of `supabase/seed-demo.sql`, and execute. This inserts synthetic posts, follower snapshots, and demographics for a demo profile.

---

### 8. (Optional) Browser capture extension

The extension enables passive live capture from LinkedIn. Build and load it if the user wants it.

#### 8a. Build

```bash
cd extension && npm install && npm run build
```

**Expected:** `extension/dist/` directory created with a manifest and bundled scripts.

#### 8b. Load in Chrome (human)

Tell the user:

> Open Chrome → go to `chrome://extensions` → enable "Developer mode" (top-right toggle) → click "Load unpacked" → select the `extension/dist` folder from this repo.

#### 8c. Generate an ingest token (human, app UI)

Tell the user:

> In the Signal app, go to `/signal/connect` and click "Generate ingest token". Copy the ingest URL and token shown on screen.

#### 8d. Configure the extension (human)

Tell the user:

> Click the Signal extension icon in Chrome → open the popup → click "Configure" → paste the ingest URL and token → click "Save".

#### 8e. Auto-capture (set-and-forget)

Once a token is configured the extension **auto-captures on a schedule** — the user does not need to manually visit their analytics pages. While the browser is open and the user is logged into LinkedIn, the extension opens the analytics pages in a background tab on a jittered ~12-hour schedule (configurable down to a 180-minute minimum, adjustable in the popup). Default: **on**.

Important constraints:
- "Capture only sees the LinkedIn account currently logged into that browser." One browser session = one account.
- Auto-capture only runs while the browser is open; it does not run in the background when Chrome is closed.
- The extension uses the user's own session and IP — no credentials are stored and no server-side scraping occurs.

#### 8f. Multi-account capture (ghostwriters / agencies)

To track multiple LinkedIn accounts, use the per-profile ingest token (generated at `/signal/connect` for each profile). Two patterns:

1. **Separate Chrome profile per client.** Run a Chrome profile logged into that client's LinkedIn, install the extension in that profile, and configure it with that client's ingest token. Each profile captures independently on its own schedule.
2. **Client self-installs.** Share the client's ingest token with them; they install the extension on their own browser and paste in the token. Their captures flow into your shared multi-profile Signal dashboard — they need no Signal login of their own.

---

## Summary checklist

| Step | Who |
|------|-----|
| `npm install && npm run build && npm run test` | Agent (CLI) |
| `supabase login` | Human (browser auth) |
| `supabase orgs list` → `supabase projects create` | Agent (human provides name, password, region) |
| `supabase link --project-ref <ref>` | Agent (CLI) |
| `supabase db push` | Agent (CLI) |
| `supabase projects api-keys --project-ref <ref>` | Agent (CLI) |
| `supabase functions deploy ingest` (optional — extension only) | Agent (CLI) |
| Write `.env.local` | Agent (CLI) |
| `npm run dev` OR `vercel login` + `vercel --prod` | Agent (Vercel login = human browser) |
| Click magic-link email | Human |
| Upload Shield CSV or LinkedIn XLSX at `/import` | Human |
| Load extension, configure popup | Human |
