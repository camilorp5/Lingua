import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { findClipsForWord } from './services/youtubeService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Si quieres restringir a Vercel en producción, puedes pasar allowedOrigins;
// si dejas app.use(cors()) abierto, funciona para pruebas y múltiples dominios.
app.use(cors());
app.use(express.json());

// Caché simple en memoria (en Render free tier se limpia si el servicio se duerme/reinicia)
const memoryCache = new Map();

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ClipLex API' });
});

app.get('/api/clips', async (req, res) => {
  const { word, targetLang = 'en', uiLang = 'es' } = req.query;
  console.log(`[Server] /api/clips -> word="${word}" targetLang=${targetLang} uiLang=${uiLang}`);

  if (!word) return res.status(400).json({ error: 'Falta la palabra' });

  const cacheKey = `${targetLang}:${uiLang}:${word.toLowerCase()}`;
  const cachedClips = memoryCache.get(cacheKey);
  if (cachedClips?.length) {
    return res.json(cachedClips);
  }

  try {
    const clips = await findClipsForWord(word, targetLang);
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

app.listen(PORT, () => console.log(`ClipLex API corriendo en puerto ${PORT}`));