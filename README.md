# SnapCal

A free, long-term calorie tracker: snap a photo of your meal, get an AI-estimated calorie/macro breakdown logged automatically. No food database, no manual search — with a manual-entry fallback always available.

## Stack

- **Frontend/Backend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Database + Auth**: Supabase (Postgres + Row Level Security)
- **AI vision**: Google Gemini (`gemini-flash-latest`)
- **Charts**: Recharts
- **Hosting**: Vercel

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in the values below
npm run dev
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (server-only, keep secret) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) (server-only, keep secret) |

### Database

Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL Editor (Project → SQL Editor → New query). It creates `profiles`, `meals`, and `log_access` (the sharing/permissions table) with Row Level Security policies already wired up. Safe to re-run.

## How photos are handled

Meal photos are compressed client-side (canvas, max 800px, JPEG ~70%), sent to a server route that forwards them to Gemini for analysis, and then discarded — only the resulting JSON (items + calorie/macro totals) is stored. Nothing is ever written to Supabase Storage, which keeps the app on the free tier indefinitely.

## Sharing model

Each user's log is private by default. An owner can invite another registered user by email to view their log (view-only); the invitee explicitly accepts or declines, and the owner can revoke access at any time. Enforced by Postgres RLS via the `log_access` table — see `supabase/schema.sql`.

## Deploying

Push to GitHub and import the repo on [Vercel](https://vercel.com/new). Add the four environment variables above in the Vercel project settings, then redeploy.
