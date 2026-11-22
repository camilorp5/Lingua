import { Supadata } from '@supadata/js';

const TRANSCRIPT_REQUEST_INTERVAL_MS = 1_000;
const TRANSCRIPT_JOB_TIMEOUT_MS = 60_000;
let lastTranscriptRequestTime = 0;
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

function scheduleTranscriptRequest(request) {
  const operation = transcriptRequestQueue.then(async () => {
    const waitMs = TRANSCRIPT_REQUEST_INTERVAL_MS - (Date.now() - lastTranscriptRequestTime);
    if (waitMs > 0) await delay(waitMs);
    lastTranscriptRequestTime = Date.now();
    return request();
  });
  transcriptRequestQueue = operation.catch(() => {});
  return operation;
}

async function requestTranscript(videoId, supadata) {
  const result = await scheduleTranscriptRequest(
    () => supadata.transcript({ url: `https://youtu.be/${videoId}` })
  );
  if (!('jobId' in result)) return result;

  const deadline = Date.now() + TRANSCRIPT_JOB_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(TRANSCRIPT_REQUEST_INTERVAL_MS);
    const jobResult = await scheduleTranscriptRequest(
      () => supadata.transcript.getJobStatus(result.jobId)
    );
    if (jobResult.status === 'completed') return jobResult.result;
    if (jobResult.status === 'failed') {
      throw new Error(jobResult.error?.message || `Supadata no pudo obtener la transcripción de ${videoId}.`);
    }
  }

  throw new Error(`Supadata no completó la transcripción de ${videoId} a tiempo.`);
}

function normalizeTranscriptSegments(value) {
  const segments = Array.isArray(value)
    ? value
    : Array.isArray(value?.content)
      ? value.content
      : value?.segments;
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

  const transcriptApiKey = process.env.SUPADATA_API_KEY;
  if (eligibleCandidates.length > 0 && !transcriptApiKey) {
    const error = new Error('Falta SUPADATA_API_KEY en la configuración del servidor.');
    error.status = 503;
    throw error;
  }
  const supadata = eligibleCandidates.length > 0
    ? new Supadata({ apiKey: transcriptApiKey })
    : null;

  for (const { videoId, snippet } of eligibleCandidates) {
    if (matchedClips.length >= CLIP_RESULT_LIMIT) break;

    try {
      transcriptAttempts += 1;
      const transcriptResult = await requestTranscript(videoId, supadata);
      const transcript = normalizeTranscriptSegments(transcriptResult);
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