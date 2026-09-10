# AI Toolkit

Four small AI writing tools (Improve, Summarize, Translate, Email) behind a
mobile-first React UI, backed by a small Express server that holds the
Anthropic API key and does the actual model calls.

```
ai-toolkit/
  .env.example      one shared env template for both server and client
  server/           Express API — key, prompts, validation, rate limiting
  client/           React app (Vite) — UI only, talks to the server
```

Each app (`server/`, `client/`) has its own `package.json` because they run
as separate processes with completely different dependencies (Express +
Anthropic SDK vs. React + Vite). They share one `.env` file at the project
root so there's only one place to configure.

## Why client and server are separate

The API key must never reach the browser — anyone could read it out of the
page source. So the client only ever talks to our own server, and the
server is the only thing that talks to Anthropic.

## Running it locally

**0. One-time setup — the shared .env**

```bash
cp .env.example .env
```

Open `.env` and paste your real Anthropic API key into `ANTHROPIC_API_KEY`.
Everything else in the file has a working default.

**1. Server**

```bash
cd server
npm install
npm run dev                # http://localhost:3001
```

**2. Client** (in a second terminal)

```bash
cd client
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 — every "run" goes through your own server
instead of directly to Anthropic.

## Project files

| File | Purpose |
|---|---|
| `.env.example` | Template for the one shared `.env` (server + client config) |
| `.gitignore` | Keeps `.env` and `node_modules` out of version control |
| `README.md` | This file |
| `server/package.json` | Server dependencies and npm scripts |
| `server/src/index.js` | Express app: validation, rate limiting, prompt building, the Anthropic call |
| `client/package.json` | Client dependencies and npm scripts |
| `client/index.html` | HTML shell Vite serves; loads fonts and the app entry script |
| `client/vite.config.js` | Dev server config (port, where to find the shared `.env`) |
| `client/src/App.jsx` | The entire UI, the API client that calls the server, and the code that mounts the app |

## What's already handled

- **API key stays server-side** — only `server/src/index.js` reads `ANTHROPIC_API_KEY`
- **Per-IP rate limiting** — 30 generations / 15 min by default
- **Input validation** — required, trimmed, capped at 8,000 characters, and
  every dropdown/tone value is checked against an allow-list on the server,
  not just trusted from the client
- **Distinguishable errors** — missing/invalid API key, Anthropic-side rate
  limiting, and bad input all return different, readable messages
- **Request timeout on the client** — if the server hangs, the button stops
  spinning after 30s instead of forever
- **`.gitignore`** — the real `.env` can't accidentally end up in version control

## Known limitations (intentionally left for later)

- The rate limiter counts requests in memory: resets on restart, and only
  works correctly with a single server process. A shared store (Redis)
  only matters once you run more than one instance.
- No logging/monitoring beyond `console.log`/`console.error`.
- No authentication — anyone who can reach the server can call
  `/api/generate`. Fine while it's free/no-account, worth revisiting before
  a public launch with real traffic.
- No Docker, no database, no payments — deliberately out of scope for now.

## Environment variables

All in one file: `.env` at the project root (copy from `.env.example`).

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | server | Your real key. Never commit this. |
| `PORT` | No | server | Defaults to `3001`. |
| `CLIENT_ORIGIN` | No | server | Which frontend origin may call the API (CORS). Defaults to `http://localhost:5173`. |
| `VITE_API_BASE` | No | client | Where the backend lives. Defaults to `http://localhost:3001`. Must start with `VITE_` for Vite to expose it to the browser. |
