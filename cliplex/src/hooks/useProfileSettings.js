import { useEffect, useState } from 'react';
import { LANGUAGES } from '../config/languages.js';

const STORAGE_KEY = 'clipLex_profile_settings';
const VIDEO_DURATIONS = ['any', 'short', 'medium', 'long'];
const LANGUAGE_CODES = LANGUAGES.map(({ code }) => code);
const DEFAULT_SETTINGS = {
  learningLanguages: LANGUAGE_CODES,
  videoDuration: 'short',
  relevanceLanguage: 'en'
};

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return DEFAULT_SETTINGS;

    const learningLanguages = Array.isArray(saved.learningLanguages)
      ? saved.learningLanguages.filter((code) => LANGUAGE_CODES.includes(code))
      : DEFAULT_SETTINGS.learningLanguages;

    return {
      learningLanguages: learningLanguages.length ? learningLanguages : DEFAULT_SETTINGS.learningLanguages,
      videoDuration: VIDEO_DURATIONS.includes(saved.videoDuration) ? saved.videoDuration : DEFAULT_SETTINGS.videoDuration,
      relevanceLanguage: LANGUAGE_CODES.includes(saved.relevanceLanguage)
        ? saved.relevanceLanguage
        : DEFAULT_SETTINGS.relevanceLanguage
    };
  } catch (error) {
    console.error('Could not read profile settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export default function useProfileSettings() {
  const [settings, setSettings] = useState(readSettings);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Could not save profile settings:', error);
    }
  }, [settings]);

  function updateSettings(patch) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  return { settings, updateSettings };
}
