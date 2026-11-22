import { YoutubeTranscript } from 'youtube-transcript';

const SEARCH_RESULT_LIMIT = 50;
const CLIP_RESULT_LIMIT = 10;
const TRANSCRIPT_LANGUAGES = {
  en: ['en', 'en-US', 'en-GB'],
  es: ['es', 'es-ES', 'es-MX'],
  pt: ['pt', 'pt-BR', 'pt-PT'],
  it: ['it', 'it-IT'],
  de: ['de', 'de-DE']
};

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

function getTranscriptLanguageOptions(lang, snippet) {
  const baseLanguage = lang.toLowerCase().split('-')[0];
  const regionalLanguages = TRANSCRIPT_LANGUAGES[baseLanguage] || [lang];
  const videoLanguages = [snippet?.defaultAudioLanguage, snippet?.defaultLanguage]
    .filter((language) => isLanguageMatch(language, lang));

  return [...new Set([...videoLanguages, ...regionalLanguages, lang])];
}

async function fetchVideoTranscript(videoId, languages) {
  let lastError;
  for (const language of languages) {
    try {
      return await YoutubeTranscript.fetchTranscript(videoId, { lang: language });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`No transcript is available for ${videoId}.`);
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

  for (const item of candidates) {
    if (matchedClips.length >= CLIP_RESULT_LIMIT) break;
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

    try {
      transcriptAttempts += 1;
      const transcript = await fetchVideoTranscript(
        videoId,
        getTranscriptLanguageOptions(lang, snippet)
      );
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
