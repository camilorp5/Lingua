import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'clipLex_vault_by_language';
const LEGACY_STORAGE_KEY = 'clipLex_vault';

function readVaults() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const vaults = JSON.parse(saved);
      if (!vaults || typeof vaults !== 'object' || Array.isArray(vaults)) {
        throw new Error('Saved vault data is invalid.');
      }
      return { vaults, error: '' };
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const legacyWords = legacy ? JSON.parse(legacy) : [];
    if (!Array.isArray(legacyWords)) throw new Error('Legacy saved vault data is not a list.');
    const vaults = legacyWords.reduce((current, word) => {
      if (!word?.word) return current;
      const language = word.targetLang || 'en';
      current[language] = [...(current[language] || []), word];
      return current;
    }, {});
    return { vaults, error: '' };
  } catch (error) {
    console.error('Could not read the saved vault:', error);
    return { vaults: {}, error: 'Could not load the saved vocabulary from this browser.' };
  }
}

export default function useVault() {
  const [initialState] = useState(readVaults);
  const [vaults, setVaults] = useState(initialState.vaults);
  const [storageError, setStorageError] = useState(initialState.error);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vaults));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      if (active) setStorageError('');
    }).catch((error) => {
      console.error('Could not save the vocabulary vault:', error);
      if (active) setStorageError('Could not save changes to the vocabulary vault.');
    });
    return () => {
      active = false;
    };
  }, [vaults]);

  const toggleVault = useCallback((wordObj, language) => {
    if (!wordObj?.word) return;
    setVaults((current) => {
      const words = current[language] || [];
      const exists = words.some((word) => word.word.toLowerCase() === wordObj.word.toLowerCase());
      if (exists) {
        return {
          ...current,
          [language]: words.filter((word) => word.word.toLowerCase() !== wordObj.word.toLowerCase())
        };
      }

      const now = new Date();
      return {
        ...current,
        [language]: [{
          ...wordObj,
          targetLang: language,
          savedAt: now.toISOString(),
          srsIntervalDays: 3,
          nextReviewDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }, ...words]
      };
    });
  }, []);

  const addWord = useCallback((wordObj, language) => {
    if (!wordObj?.word?.trim()) return;
    setVaults((current) => {
      const words = current[language] || [];
      if (words.some((item) => item.word.toLowerCase() === wordObj.word.trim().toLowerCase())) {
        return current;
      }
      const now = new Date();
      return {
        ...current,
        [language]: [{
          ...wordObj,
          word: wordObj.word.trim(),
          targetLang: language,
          savedAt: now.toISOString(),
          srsIntervalDays: 3,
          nextReviewDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }, ...words]
      };
    });
  }, []);

  const removeWord = useCallback((word, language) => {
    setVaults((current) => ({
      ...current,
      [language]: (current[language] || []).filter(
        (item) => item.word.toLowerCase() !== word.toLowerCase()
      )
    }));
  }, []);

  const isWordInVault = useCallback((word, language) => (
    (vaults[language] || []).some((item) => item.word.toLowerCase() === word?.toLowerCase())
  ), [vaults]);

  const rateRecall = useCallback((word, rating, language) => {
    const intervalDays = { easy: 7, medium: 3, hard: 1 }[rating];
    if (!intervalDays) return;

    setVaults((current) => ({
      ...current,
      [language]: (current[language] || []).map((item) => (
        item.word.toLowerCase() === word.toLowerCase()
          ? {
              ...item,
              srsIntervalDays: intervalDays,
              nextReviewDate: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString()
            }
          : item
      ))
    }));
  }, []);

  return {
    vaults,
    toggleVault,
    addWord,
    removeWord,
    isWordInVault,
    rateRecall,
    storageError
  };
}
