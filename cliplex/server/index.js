import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { findClipsForWord } from './services/youtubeService.js';
import { getCachedValue, initializeCacheStore, setCachedValue } from './cache/cacheStore.js';

const app = express();
const PORT = process.env.PORT || 3001;
const SEARCH_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const NOT_FOUND_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 5000;

// Si quieres restringir a Vercel en producción, puedes pasar allowedOrigins;
// si dejas app.use(cors()) abierto, funciona para pruebas y múltiples dominios.
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ClipLex API' });
});

app.get('/api/clips', async (req, res) => {
  const { word, targetLang = 'en', uiLang = 'es' } = req.query;
  console.log(`[Server] /api/clips -> word="${word}" targetLang=${targetLang} uiLang=${uiLang}`);

  if (typeof word !== 'string' || !word.trim()) {
    return res.status(400).json({ error: 'Falta la palabra' });
  }

  const normalizedWord = word.trim().toLocaleLowerCase();
  const cacheKey = `${targetLang}:${normalizedWord}`;

  try {
    const cachedResponse = await getCachedValue('searches', cacheKey);
    if (cachedResponse) {
      return res.status(cachedResponse.status).json(cachedResponse.body);
    }

    const clips = await findClipsForWord(word.trim(), targetLang);
    console.log(`[Server] Clips encontrados para "${word}": ${clips.length}`);
    const response = { status: 200, body: clips };
    await setCachedValue(
      'searches',
      cacheKey,
      response,
      { ttlMs: SEARCH_CACHE_TTL_MS, maxEntries: SEARCH_CACHE_MAX_ENTRIES }
    );
    return res.json(clips);
  } catch (err) {
    const status = err?.status || 500;
    const body = { error: err?.message || 'Error interno al buscar clips' };
    console.error('[Server] Error en /api/clips:', err);

    if (status === 404) {
      await setCachedValue(
        'searches',
        cacheKey,
        { status, body },
        { ttlMs: NOT_FOUND_CACHE_TTL_MS, maxEntries: SEARCH_CACHE_MAX_ENTRIES }
      );
    }

    return res.status(status).json(body);
  }
});

await initializeCacheStore();
app.listen(PORT, () => console.log(`ClipLex API corriendo en puerto ${PORT}`));