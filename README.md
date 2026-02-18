<div align="center">

![OpenClaw Miami](public/og-image.png)

# OpenClaw Miami

**Miami's community for the AI agent that's breaking the internet.**

[![MIT License](https://img.shields.io/badge/License-MIT-coral.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?logo=discord&logoColor=white)](https://discord.com/channels/1456350064065904867/1464825842264703221)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-145K+%20Stars-yellow?logo=github)](https://github.com/openclaw/openclaw)
[![Meetups](https://img.shields.io/badge/Meetups-Monthly-ff6b6b)](https://lu.ma/openclaw)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

[Website](https://openclawmiami.com) · [Events](https://lu.ma/openclaw) · [Discord](https://discord.com/channels/1456350064065904867/1464825842264703221) · [Contribute](#contributing)

</div>

---

## What is OpenClaw Miami?

We're **50+ builders** in Miami exploring the future of personal AI. [OpenClaw](https://github.com/openclaw/openclaw) is the open-source AI agent with **145K+ GitHub stars** — and we're bringing it to life locally.

- **Monthly meetups** — Hands-on sessions, demos, and networking
- **Setup help** — Get OpenClaw running on your machine
- **Community** — Connect with Miami's AI builders

## Quick Start

```bash
git clone https://github.com/Purple-Horizons/openclawmiami.git
cd openclawmiami
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) and you're in.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build |
| `npm run build:attendees -- --input "<path-to-csv>"` | Create hashed attendee lookup data |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |

## Self Check-In (No Traditional DB)

This repo includes a `/check-in` page for event self check-in:

- attendee lookup by email (against hashed list)
- if not found: walk-in registration (first name, last name, email, referred by)
- check-in survey:
  - Have you deployed an OpenClaw agent yet?
  - If yes, what's the biggest obstacle?
- anonymous live stats panel (yes/no totals + obstacle list)
- dedicated snapshot screen for a second monitor: `/check-in/snapshot`
- organizer report of who checked in: `/check-in/report`

### 1) Build attendee lookup from your CSV

```bash
npm run build:attendees -- --input "/absolute/path/to/submissions.csv"
```

This writes `data/attendees-hashes.json` with hashed email keys and **encrypted attendee names**.

Optional hardening:

```bash
CHECKIN_EMAIL_HASH_PEPPER="your-secret-pepper" npm run build:attendees -- --input "/absolute/path/to/submissions.csv"
```

Use the same `CHECKIN_EMAIL_HASH_PEPPER` in runtime env vars.

### 2) Runtime storage options

- Recommended on Vercel: set `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Vercel KV / Upstash REST). No DB server to run.
- Local fallback (dev only): encrypted JSON file at `.checkin-data/checkins.json`.

### 3) Security env vars

- `CHECKIN_ENCRYPTION_KEY` (required for production): encrypts stored check-in records (name/email + responses).
- `CHECKIN_EMAIL_HASH_PEPPER` (required for production): salts attendee email hashing.
- `CHECKIN_REPORT_TOKEN` (required for report access): protects `/api/checkin/report` and `/check-in/report`.

### 4) Environment setup (local + Vercel)

Yes: set the same secrets locally and on Vercel when testing production behavior.

- Local:
  - copy `.env.example` to `.env.local`
  - set `CHECKIN_ENCRYPTION_KEY`, `CHECKIN_EMAIL_HASH_PEPPER`, `CHECKIN_REPORT_TOKEN`
  - run `vercel dev` for API routes
- Vercel:
  - add the same env vars in Project Settings -> Environment Variables
  - redeploy after updates

### 5) Abuse protection enabled

- IP-based rate limits:
  - lookup: 40/min
  - register: 10/15min
  - submit: 20/15min
  - stats: 120/min
  - report: 30/5min
  - failed report auth: 8/15min
- report token accepted via `x-report-token` header only (not query string).
- report endpoint is disabled unless `CHECKIN_REPORT_TOKEN` is configured.

### 6) Optional AI obstacle themes

- `/check-in/snapshot` shows top 3 obstacle themes.
- If `OPENROUTER_API_KEY` is set, themes are AI-grouped (cheap model configurable with `OPENROUTER_MODEL`).
- You can provide extra event/domain guidance with `OPENROUTER_OPENCLAW_CONTEXT`.
- If not set, deterministic heuristic grouping is used (no extra cost).

## Tech Stack

**React 18** · **TypeScript** · **Vite** · **Tailwind CSS** · **shadcn/ui** · **Framer Motion**

## Contributing

We love contributions! Here's how:

1. **Fork** the repo
2. **Create** a branch (`git checkout -b feature/cool-thing`)
3. **Make** your changes
4. **Test** (`npm run lint && npm run test`)
5. **Push** and open a **PR**

See something broken? [Open an issue](https://github.com/Purple-Horizons/openclawmiami/issues).

## Contact

| Who | Links |
|-----|-------|
| **Gianni Dalerta** | [@gianni-dalerta](https://github.com/gianni-dalerta) · [@giannidalerta](https://twitter.com/giannidalerta) |
| **Ralph Quintero** | [@ralphquintero](https://twitter.com/ralphquintero) everywhere |
| **Purple Horizons** | [purplehorizons.io](https://purplehorizons.io) |

## License

MIT — do whatever you want.

---

<div align="center">

**Built with cafesitos and croquetas in Miami 🦞**

[Join the community →](https://discord.com/channels/1456350064065904867/1464825842264703221)

</div>
