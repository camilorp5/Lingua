const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function generateJson(prompt, responseSchema) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const error = new Error('Gemini is not configured. Set GEMINI_API_KEY in the server environment.');
    error.status = 503;
    throw error;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema }
      })
    }
  );
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error?.message || `Gemini request failed (${response.status})`);
    error.status = 502;
    throw error;
  }

  const responseText = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    const error = new Error('Gemini returned an empty response.');
    error.status = 502;
    throw error;
  }

  try {
    return JSON.parse(responseText);
  } catch (cause) {
    const error = new Error('Gemini returned invalid JSON.');
    error.status = 502;
    error.cause = cause;
    throw error;
  }
}

export async function translateText(text, targetLang, uiLang) {
  const result = await generateJson(
    `Translate this short subtitle into language ${uiLang}, keeping its meaning natural: ${text}`,
    {
      type: 'OBJECT',
      properties: { translation: { type: 'STRING' } },
      required: ['translation']
    }
  );
  return result.translation;
}

export function evaluateSentence({ sentence, word, targetLang, uiLang }) {
  return generateJson(
    `Act as a language tutor. The learner studies ${targetLang} and speaks ${uiLang}.
Target word: "${word}"
Learner sentence: "${sentence}"
Return a naturalness score from 0 to 100, a brief explanation in ${uiLang}, and a natural alternative in ${targetLang}.`,
    {
      type: 'OBJECT',
      properties: {
        score: { type: 'NUMBER' },
        feedback: { type: 'STRING' },
        alternative: { type: 'STRING' }
      },
      required: ['score', 'feedback', 'alternative']
    }
  );
}

export function explainWord({ word, sentenceContext, targetLang, uiLang }) {
  return generateJson(
    `Explain the word "${word}" as used in this context: "${sentenceContext}". It is from ${targetLang}; explain briefly in ${uiLang}.`,
    {
      type: 'OBJECT',
      properties: { definition: { type: 'STRING' } },
      required: ['definition']
    }
  );
}

export function buildLessonFromTranscript({ transcript, targetLang, uiLang }) {
  return generateJson(
    `Create a language-learning lesson from this video transcript in ${targetLang}. Translate the chosen sentence to ${uiLang}. Keep the exact sentence from the transcript.
Transcript: "${transcript}"`,
    {
      type: 'OBJECT',
      properties: {
        keyword: { type: 'STRING' },
        targetSentence: { type: 'STRING' },
        translation: { type: 'STRING' },
        slangNote: { type: 'STRING' }
      },
      required: ['keyword', 'targetSentence', 'translation', 'slangNote']
    }
  );
}

export function generateLearningClips({ word, targetLang, uiLang }) {
  return generateJson(
    `Generate three language-learning example clips for the word "${word}" in language ${targetLang}. Translate each sentence to ${uiLang}.`,
    {
      type: 'OBJECT',
      properties: {
        phonetic: { type: 'STRING' },
        slangContext: { type: 'STRING' },
        clips: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              creator: { type: 'STRING' },
              accent: { type: 'STRING' },
              contextName: { type: 'STRING' },
              targetSentence: { type: 'STRING' },
              translation: { type: 'STRING' }
            },
            required: ['creator', 'accent', 'contextName', 'targetSentence', 'translation']
          }
        }
      },
      required: ['clips']
    }
  );
}
