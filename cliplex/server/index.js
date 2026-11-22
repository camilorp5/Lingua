import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { findClipsForWord } from './services/youtubeService.js';

const app = express();
app.use(cors());
app.use(express.json());

// Caché simple en memoria (luego puedes pasarla a JSON o Supabase)
const memoryCache = new Map();

app.get('/api/clips', async (req, res) => {
  const {
    word,
    targetLang = 'en',
    uiLang = 'es',
    videoDuration = 'short',
    relevanceLanguage = targetLang
  } = req.query;
  console.log(`[Server] /api/clips -> word="${word}" targetLang=${targetLang} uiLang=${uiLang} videoDuration=${videoDuration} relevanceLanguage=${relevanceLanguage}`);

  if (!word) return res.status(400).json({ error: 'Falta la palabra' });
  if (!['any', 'short', 'medium', 'long'].includes(videoDuration)) {
    return res.status(400).json({ error: 'videoDuration debe ser any, short, medium o long.' });
  }
  if (!['en', 'es', 'pt', 'it', 'de'].includes(relevanceLanguage)) {
    return res.status(400).json({ error: 'relevanceLanguage no es compatible.' });
  }

  const cacheKey = `${targetLang}:${uiLang}:${videoDuration}:${relevanceLanguage}:${word.toLowerCase()}`;
  const cachedClips = memoryCache.get(cacheKey);
  if (cachedClips?.length) {
    return res.json(memoryCache.get(cacheKey));
  }

  try {
    const clips = await findClipsForWord(
      word,
      targetLang,
      6,
      videoDuration,
      relevanceLanguage
    );
    console.log(`[Server] Clips encontrados para "${word}": ${clips.length}`);
    if (clips.length === 0) {
      return res.status(404).json({ error: `No se encontraron videos con subtítulos para "${word}".` });
    }
    memoryCache.set(cacheKey, clips);
    return res.json(clips);
  } catch (err) {
    console.error('[Server] Error en /api/clips:', err);
    return res.status(err?.status || 500).json({
      error: err?.message || 'Error interno al buscar clips',
    });
  }
});

app.listen(3001, () => console.log('ClipLex API corriendo en http://localhost:3001'));