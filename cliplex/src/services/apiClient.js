import { API_BASE_URL } from '../config/api.js';

const isDev = import.meta.env.DEV;

export async function fetchWordClips({
  word,
  targetLang,
  uiLang,
  signal
}) {
  const params = new URLSearchParams({ word, targetLang, uiLang });
  const endpoint = `${API_BASE_URL}/api/clips?${params.toString()}`;

  if (isDev) {
    console.info('[Lingua:API] Solicitando clips ->', { word, targetLang, uiLang });
  }

  try {
    const res = await fetch(endpoint, { signal });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      console.error('[Lingua:API] Respuesta no OK:', {
        status: res.status,
        endpoint,
        body: data,
      });
      throw new Error(data?.error || `Error HTTP ${res.status}`);
    }

    const clips = Array.isArray(data)
      ? data
      : Array.isArray(data?.clips)
        ? data.clips
        : [];

    if (clips.length === 0) {
      throw new Error(`YouTube no devolvió videos con subtítulos para "${word}".`);
    }

    if (!Array.isArray(data) && !Array.isArray(data?.clips)) {
      console.warn('[Lingua:API] Formato inesperado en /api/clips:', data);
    } else if (isDev) {
      console.info(`[Lingua:API] Recibidos ${clips.length} clips para "${word}"`);
    }

    return clips;
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[Lingua:API] Falló fetchWordClips:', err.message);
    }
    throw err;
  }
}

export const getClips = fetchWordClips;

export async function lookupWord({ word, targetLang, uiLang, sentenceContext = '' }) {
  if (!word) return null;

  const params = new URLSearchParams({
    word,
    targetLang,
    uiLang,
    context: sentenceContext,
  });
  const endpoint = `${API_BASE_URL}/api/lookup?${params.toString()}`;

  if (isDev) {
    console.info('[Lingua:API] Consultando palabra ->', { word, targetLang, uiLang });
  }

  try {
    const res = await fetch(endpoint);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (isDev) {
        console.warn('[Lingua:API] /api/lookup no disponible o con error:', res.status, data);
      }
      return {
        word,
        phonetic: '',
        meaning: 'Definición no disponible por ahora.',
        example: sentenceContext,
      };
    }

    return data;
  } catch (err) {
    if (isDev) {
      console.warn('[Lingua:API] Falló lookupWord (usando respaldo):', err.message);
    }
    return {
      word,
      phonetic: '',
      meaning: 'Definición no disponible sin conexión al backend.',
      example: sentenceContext,
    };
  }
}

export async function evaluateSentence({ word, sentence, targetLang, uiLang }) {
  const endpoint = `${API_BASE_URL}/api/evaluate`;

  if (isDev) {
    console.info('[Lingua:API] Evaluando frase ->', { word, sentence, targetLang, uiLang });
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, sentence, targetLang, uiLang }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (isDev) {
        console.warn('[Lingua:API] /api/evaluate no disponible o con error:', res.status, data);
      }
      const containsWord =
        typeof sentence === 'string' &&
        typeof word === 'string' &&
        sentence.toLowerCase().includes(word.toLowerCase());

      return {
        score: containsWord ? 85 : 55,
        feedback: containsWord
          ? `Buen intento usando "${word}".`
          : `Intenta incluir explícitamente la palabra "${word}" en tu oración.`,
        alternative: sentence,
      };
    }

    return data;
  } catch (err) {
    if (isDev) {
      console.warn('[Lingua:API] Falló evaluateSentence (usando respaldo):', err.message);
    }
    return {
      score: 75,
      feedback: 'Evaluación local de respaldo mientras conectas el endpoint /api/evaluate.',
      alternative: sentence,
    };
  }
}

export const evaluateSentenceWithGemini = evaluateSentence;

export async function generateClips({ word, targetLang, uiLang }) {
  const res = await fetch(`${API_BASE_URL}/api/generate-clips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, targetLang, uiLang }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Error HTTP ${res.status}`);
  }
  return data;
}

export async function importVideo({ url, targetLang, uiLang }) {
  const res = await fetch(`${API_BASE_URL}/api/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, targetLang, uiLang }),
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Error HTTP ${res.status}`);
  }
  return data;
}