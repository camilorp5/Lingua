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

Install dependencies and copy `.env.example` to `.env`. Set `YOUTUBE_API_KEY`, `SUPADATA_API_KEY`, `QDRANT_URL`, and `GEMINI_API_KEY` on the server. Set `QDRANT_API_KEY` when required by your Qdrant instance, and optionally change `QDRANT_COLLECTION`; do not expose these credentials through `VITE_*` variables.

```sh
npm install
npm run dev:server
```

In another terminal, run `npm run dev`. The Vite development server proxies `/api` requests to `http://localhost:3001`. Set `VITE_API_BASE_URL` when the API is hosted at a different origin.

Without configured API keys, curated local clips remain available. Requests to external services show an error in the corresponding view rather than returning fabricated results.

## Render deployment

Configure `YOUTUBE_API_KEY`, `SUPADATA_API_KEY`, and `QDRANT_URL` as server environment variables on the Render API service. Set `QDRANT_API_KEY` if your Qdrant instance requires it. The API creates `QDRANT_COLLECTION` (`youtube-transcripts` by default) if it does not exist, and caches transcripts by YouTube video ID plus matched word intervals so cache hits do not consume Supadata credits. Reel histories remain profile-specific in the browser; unseen clips are ordered first, watched reels loop at their selected interval, and the feed wraps to watched clips after all available videos have been seen. Render supplies `PORT`; do not expose credentials through a `VITE_*` variable. For a separately hosted frontend, set `VITE_API_BASE_URL` to the API service origin at build time, without a trailing slash.

The API caches successful clip searches in memory only. Restarts and separate Render instances have independent caches; `server/cache/clipsCache.json` is not used by the API.

## Scripts

- `npm run dev` — Vite frontend
- `npm run dev:server` — Express API with file watching
- `npm run start:server` — Express API
- `npm run build` — production frontend build
- `npm run lint` — ESLint
