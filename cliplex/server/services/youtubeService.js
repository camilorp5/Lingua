const TRANSCRIPT_API_URL = 'https://www.youtube-transcript.io/api/transcripts';
const TRANSCRIPT_BATCH_SIZE = 50;
const TRANSCRIPT_REQUEST_LIMIT = 5;
const TRANSCRIPT_REQUEST_WINDOW_MS = 10_000;
const TRANSCRIPT_MAX_RETRIES = 3;
let transcriptRequestTimes = [];
let transcriptRequestQueue = Promise.resolve();

const SEARCH_RESULT_LIMIT = 50;
const CLIP_RESULT_LIMIT = 10;
async function fetchYouTubeJson(endpoint, params, apiKey) {
  const searchParams = new URLSearchParams({ ...params, key: apiKey });
  const response = await fetch(`${endpoint}?${searchParams}`);
  const data = await response.json().catch(() => null);

  if (!response.ok || data?.error) {
    const error = new Error(data?.error?.message || `YouTube request failed (${response.status}).`);
    error.status = response.status === 403 ? 502 : response.status;
    throw error;
  }
  return data;
}

function isLanguageMatch(language, expectedLanguage) {
  if (typeof language !== 'string' || !language.trim()) return false;
  const expectedBase = expectedLanguage.toLowerCase().split('-')[0];
  return language.toLowerCase().split('-')[0] === expectedBase;
}

function isNativeVideo(snippet, lang) {
  const declaredLanguages = [snippet?.defaultLanguage, snippet?.defaultAudioLanguage]
    .filter((language) => typeof language === 'string' && language.trim());

  return declaredLanguages.length === 0
    || declaredLanguages.some((language) => isLanguageMatch(language, lang));
}

function createWordRegex(word) {
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escapedWord}(?![\\p{L}\\p{N}_])`, 'iu');
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getRetryAfterMs(value) {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const retryAt = Date.parse(value);
  return Number.isNaN(retryAt) ? null : Math.max(0, retryAt - Date.now());
}

async function waitForTranscriptRequestSlot() {
  while (true) {
    const now = Date.now();
    transcriptRequestTimes = transcriptRequestTimes.filter(
      (requestTime) => now - requestTime < TRANSCRIPT_REQUEST_WINDOW_MS
    );
    if (transcriptRequestTimes.length < TRANSCRIPT_REQUEST_LIMIT) {
      transcriptRequestTimes.push(now);
      return;
    }

    await delay(transcriptRequestTimes[0] + TRANSCRIPT_REQUEST_WINDOW_MS - now);
  }
}

async function requestTranscriptBatch(ids, token) {
  const operation = transcriptRequestQueue.then(async () => {
    for (let attempt = 0; ; attempt += 1) {
      await waitForTranscriptRequestSlot();
      const response = await fetch(TRANSCRIPT_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });

      if (response.status === 429) {
        const retryAfterMs = getRetryAfterMs(response.headers.get('Retry-After'));
        if (retryAfterMs === null) {
          const error = new Error('YouTube Transcript API respondió 429 sin un Retry-After válido.');
          error.status = 502;
          throw error;
        }
        if (attempt >= TRANSCRIPT_MAX_RETRIES) {
          const error = new Error('YouTube Transcript API sigue respondiendo 429 tras varios reintentos.');
          error.status = 429;
          throw error;
        }
        await delay(retryAfterMs);
        continue;
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const error = new Error(
          data?.message || `YouTube Transcript API request failed (${response.status}).`
        );
        error.status = response.status >= 500 ? 502 : response.status;
        throw error;
      }
      return data;
    }
  });
  transcriptRequestQueue = operation.catch(() => {});
  return operation;
}

function getTranscriptResults(data) {
  const records = Array.isArray(data)
    ? data
    : Array.isArray(data?.transcripts)
      ? data.transcripts
      : Array.isArray(data?.results)
        ? data.results
        : data && typeof data === 'object'
          ? [data]
          : [];

  const transcripts = new Map();
  for (const record of records) {
    const videoId = record?.id || record?.videoId;
    if (typeof videoId === 'string') {
      transcripts.set(videoId, record.transcript || record.segments);
      continue;
    }

    if (record && typeof record === 'object') {
      for (const [id, transcript] of Object.entries(record)) {
        transcripts.set(id, transcript?.transcript || transcript?.segments || transcript);
      }
    }
  }
  return transcripts;
}

function normalizeTranscriptSegments(value) {
  const segments = Array.isArray(value) ? value : value?.segments;
  if (!Array.isArray(segments) || segments.length === 0) return null;

  const normalized = segments.map((segment) => {
    const offset = Number.isFinite(segment?.offset)
      ? segment.offset
      : Number.isFinite(segment?.start)
        ? segment.start * 1000
        : Number.isFinite(segment?.startMs)
          ? segment.startMs
          : NaN;
    const duration = Number.isFinite(segment?.duration)
      ? (Number.isFinite(segment?.offset) ? segment.duration : segment.duration * 1000)
      : Number.isFinite(segment?.durationMs)
        ? segment.durationMs
        : NaN;

    if (typeof segment?.text !== 'string' || !Number.isFinite(offset) || !Number.isFinite(duration)) {
      return null;
    }
    return { text: segment.text, offset, duration };
  });

  return normalized.every(Boolean) ? normalized : null;
}

async function fetchVideoTranscripts(videoIds) {
  const results = new Map();
  if (videoIds.length === 0) return results;

  const token = process.env.YOUTUBE_TRANSCRIPT_API_TOKEN;
  if (!token) {
    const error = new Error('Falta YOUTUBE_TRANSCRIPT_API_TOKEN en la configuración del servidor.');
    error.status = 503;
    throw error;
  }

  for (let index = 0; index < videoIds.length; index += TRANSCRIPT_BATCH_SIZE) {
    const ids = videoIds.slice(index, index + TRANSCRIPT_BATCH_SIZE);
    const data = await requestTranscriptBatch(ids, token);
    const transcriptsById = getTranscriptResults(data);

    for (const videoId of ids) {
      const segments = normalizeTranscriptSegments(transcriptsById.get(videoId));
      if (segments) results.set(videoId, { segments });
      else results.set(videoId, { error: new Error(`No transcript is available for ${videoId}.`) });
    }
  }

  return results;
}

export async function findClipsForWord(word, lang = 'en') {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    const error = new Error('Falta YOUTUBE_API_KEY en cliplex/.env.');
    error.status = 503;
    throw error;
  }

  const searchData = await fetchYouTubeJson(
    'https://www.googleapis.com/youtube/v3/search',
    {
      part: 'snippet',
      type: 'video',
      videoCaption: 'closedCaption',
      relevanceLanguage: lang,
      maxResults: String(SEARCH_RESULT_LIMIT),
      q: word
    },
    apiKey
  );
  const candidates = Array.isArray(searchData.items) ? searchData.items : [];
  console.log(`[YouTube API] Videos candidatos devueltos: ${candidates.length}`);
  if (candidates.length === 0) {
    const error = new Error(`YouTube no encontró videos para "${word}".`);
    error.status = 404;
    throw error;
  }

  const videoIds = candidates.map((item) => item.id?.videoId).filter(Boolean);
  const videoData = await fetchYouTubeJson(
    'https://www.googleapis.com/youtube/v3/videos',
    {
      part: 'snippet',
      id: videoIds.join(','),
      fields: 'items(id,snippet(defaultLanguage,defaultAudioLanguage))'
    },
    apiKey
  );
  const videoDetails = new Map(
    (videoData.items || []).map((video) => [video.id, video.snippet || {}])
  );
  const regex = createWordRegex(word);
  const matchedClips = [];
  let languageMismatchCount = 0;
  let transcriptAttempts = 0;
  let transcriptFailures = 0;
  let transcriptSuccesses = 0;
  const eligibleCandidates = [];

  for (const item of candidates) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;

    const details = videoDetails.get(videoId) || {};
    const snippet = {
      ...item.snippet,
      defaultLanguage: details.defaultLanguage || item.snippet.defaultLanguage,
      defaultAudioLanguage: details.defaultAudioLanguage || item.snippet.defaultAudioLanguage
    };
    if (!isNativeVideo(snippet, lang)) {
      languageMismatchCount += 1;
      continue;
    }

    eligibleCandidates.push({ videoId, snippet });
  }

  const transcriptResults = await fetchVideoTranscripts(
    eligibleCandidates.map(({ videoId }) => videoId)
  );

  for (const { videoId, snippet } of eligibleCandidates) {
    if (matchedClips.length >= CLIP_RESULT_LIMIT) break;

    try {
      transcriptAttempts += 1;
      const transcriptResult = transcriptResults.get(videoId);
      if (transcriptResult?.error) throw transcriptResult.error;
      const transcript = transcriptResult?.segments;
      if (!transcript) throw new Error(`No transcript is available for ${videoId}.`);
      transcriptSuccesses += 1;
      const matchIndex = transcript.findIndex((line) => regex.test(line.text));
      if (matchIndex === -1) continue;

      const segment = transcript[matchIndex];
      const startSec = Math.max(0, Math.floor(segment.offset / 1000) - 1);
      const endSec = Math.ceil((segment.offset + segment.duration) / 1000) + 2;
      const fullSentence = [
        transcript[matchIndex - 1]?.text,
        segment.text,
        transcript[matchIndex + 1]?.text
      ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

      matchedClips.push({
        id: `${videoId}_${startSec}`,
        videoId,
        creator: `@${(snippet.channelTitle || 'youtube').replace(/\s+/g, '_').toLowerCase()}`,
        title: snippet.title,
        startSec,
        endSec,
        targetSentence: fullSentence
      });
    } catch (error) {
      transcriptFailures += 1;
      console.warn(`[YouTube API] No se pudieron leer subtítulos de ${videoId}: ${error.message}`);
    }
  }

  console.log(
    `[YouTube API] Idioma distinto: ${languageMismatchCount}; `
    + `subtítulos obtenidos: ${transcriptSuccesses}; `
    + `errores de subtítulos: ${transcriptFailures}/${transcriptAttempts}`
  );
  if (matchedClips.length === 0) {
    if (transcriptAttempts > 0 && transcriptFailures === transcriptAttempts) {
      const error = new Error('YouTube devolvió videos con subtítulos, pero no fue posible obtener sus transcripciones.');
      error.status = 502;
      throw error;
    }

    const error = new Error(`No se encontraron videos en ${lang} con subtítulos que contengan "${word}".`);
    error.status = 404;
    throw error;
  }

  return matchedClips;
}
