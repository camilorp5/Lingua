# ClipLex

ClipLex is a React/Vite language-learning app with a small Express API for YouTube clips, transcripts, Gemini evaluation, and dictionary lookups.

## Structure

```text
cliplex/
├── .env.example
├── server/
│   ├── index.js
│   ├── services/
│   │   ├── geminiService.js
│   │   └── youtubeService.js
│   └── cache/
│       └── clipsCache.json
└── src/
    ├── App.jsx
    ├── config/
    ├── services/
    ├── hooks/
    └── components/
```

## Setup

Install dependencies and copy `.env.example` to `.env`. Set `YOUTUBE_API_KEY` and `GEMINI_API_KEY` on the server; do not expose these keys through `VITE_*` variables.

```sh
npm install
npm run dev:server
```

In another terminal, run `npm run dev`. The Vite development server proxies `/api` requests to `http://localhost:3001`. Set `VITE_API_BASE_URL` when the API is hosted at a different origin.

Without configured API keys, curated local clips remain available. Requests to external services show an error in the corresponding view rather than returning fabricated results.

## Render deployment

Configure `YOUTUBE_API_KEY` as a server environment variable on the Render API service. Render supplies `PORT`; do not expose the YouTube key through a `VITE_*` variable. For a separately hosted frontend, set `VITE_API_BASE_URL` to the API service origin at build time, without a trailing slash.

The API caches successful clip searches in memory only. Restarts and separate Render instances have independent caches; `server/cache/clipsCache.json` is not used by the API.

## Scripts

- `npm run dev` — Vite frontend
- `npm run dev:server` — Express API with file watching
- `npm run start:server` — Express API
- `npm run build` — production frontend build
- `npm run lint` — ESLint
