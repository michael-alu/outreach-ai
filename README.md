# outreach — AI Calling & Lead Conversion

An AI-powered outbound calling tool that uploads a CSV of leads, enriches them with Claude, then launches a voice agent that calls each lead over a real phone line targeting Rwanda (+250 numbers).

> **Claude plans the calls, makes the calls, and learns from the calls.**

---

## Six Claude Integrations

| # | Integration | Model | When |
|---|---|---|---|
| 1 | Lead enrichment & prioritization | Sonnet | On demand after CSV upload |
| 2 | Per-call system prompt generation | Sonnet | Before each call |
| 3 | Live in-call conversation | Haiku (via Vapi) | During every call |
| 4 | In-call tool use (price lookup, scheduling) | Haiku | Mid-conversation |
| 5 | Post-call transcript analysis | Sonnet | After each call ends |
| 6 | Batch rollup & script coaching | Sonnet | After campaign completes |

---

## Stack

- **Next.js 16** (App Router) + TypeScript strict
- **Tailwind CSS v4** + shadcn/ui (Base UI)
- **Prisma 7** + SQLite (`better-sqlite3` adapter)
- **@anthropic-ai/sdk** — all Claude calls server-side only
- **@vapi-ai/server-sdk** — Vapi for outbound calling
- **TanStack Query** + **Zustand** + **framer-motion** + **sonner**

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd outreach-ai
nvm use 22        # Node 22 required
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `VAPI_API_KEY` | From dashboard.vapi.ai |
| `VAPI_PHONE_NUMBER_ID` | Phone number ID of your imported Twilio number in Vapi |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (for the imported number) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `OUTBOUND_CALLER_ID` | +250... number shown on outbound calls |
| `APP_BASE_URL` | Public URL for Vapi webhooks (use ngrok for local dev) |
| `DATABASE_URL` | `file:./dev.db` (default) |

### 3. Database

```bash
npm run db:migrate   # apply schema
npm run db:seed      # load demo campaign + leads
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Telephony notes (Rwanda +250)

- Requires a Twilio number **imported into Vapi** — free Vapi numbers are US-only.
- Set `OUTBOUND_CALLER_ID` to a local Rwanda +250 number for real pitches (foreign numbers get ignored).
- For local development, use [ngrok](https://ngrok.com) to expose `APP_BASE_URL` so Vapi can POST webhook events.
- Only call numbers with explicit consent. The agent opens every call with an AI disclosure.

---

## 60-second demo script

1. Open the app — **Dashboard** shows zero state with the Claude integration breakdown.
2. Click **New Campaign** → fill in product details → upload CSV → map columns → Import.
3. On the campaign page click **Enrich & Prioritize** — Claude ranks leads and generates angles.
4. Click **Start Calling** — status pills update: Queued → Ringing → In Progress → Completed.
5. Click a completed lead → see transcript, interest score 0–100, objections, follow-up draft.
6. Dashboard → **Generate Rollup** → connect rate, objection trends, 3 script improvements.

---

## Development

```bash
npm run dev          # start dev server
npm run build        # production build
npm run db:seed      # reseed demo data
npx prisma studio    # DB GUI
```
