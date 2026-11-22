import { YoutubeTranscript } from 'youtube-transcript';

export async function findClipsForWord(
  word,
  lang = 'en',
  maxResults = 6,
  videoDuration = 'short',
  relevanceLanguage = lang
) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    const error = new Error('Falta YOUTUBE_API_KEY en cliplex/.env.');
    error.status = 503;
    throw error;
  }

  const query = encodeURIComponent(`"${word}" #shorts`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=${encodeURIComponent(videoDuration)}&videoCaption=closedCaption&relevanceLanguage=${encodeURIComponent(relevanceLanguage)}&maxResults=${maxResults}&q=${query}&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url);
  const data = await res.json().catch(() => null);

  if (!res.ok || data.error) {
    const error = new Error(data?.error?.message || `YouTube search failed (${res.status}).`);
    error.status = res.status === 403 ? 502 : res.status;
    throw error;
  }

  const items = Array.isArray(data.items) ? data.items : [];
  console.log(`[YouTube API] Videos candidatos devueltos: ${items.length}`);
  if (items.length === 0) {
    const error = new Error(`YouTube no encontró videos cortos con subtítulos para "${word}".`);
    error.status = 404;
    throw error;
  }

  const matchedClips = [];

  for (const item of items) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;

    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });

      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
      const matchIndex = transcript.findIndex(line => regex.test(line.text));

      if (matchIndex !== -1) {
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
          creator: `@${item.snippet.channelTitle.replace(/\s+/g, '_').toLowerCase()}`,
          title: item.snippet.title,
          startSec,
          endSec,
          targetSentence: fullSentence,
        });
      }
    } catch (error) {
      console.warn(`[YouTube API] No se pudieron leer subtítulos de ${videoId}: ${error.message}`);
      continue;
    }
  }

  if (matchedClips.length === 0) {
    const error = new Error(`Se encontraron videos para "${word}", pero ninguno tiene subtítulos accesibles que contengan esa palabra.`);
    error.status = 404;
    throw error;
  }

  return matchedClips;
}