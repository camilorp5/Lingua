import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'clipLex_vault';

function readVault() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const words = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(words)) throw new Error('Saved vault data is not a list.');
    return { words, error: '' };
  } catch (error) {
    console.error('Could not read the saved vault:', error);
    return { words: [], error: 'Could not load the saved vocabulary from this browser.' };
  }
}

export default function useVault() {
  const [initialState] = useState(readVault);
  const [vaultWords, setVaultWords] = useState(initialState.words);
  const [storageError, setStorageError] = useState(initialState.error);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vaultWords));
      if (active) setStorageError('');
    }).catch((error) => {
      console.error('Could not save the vocabulary vault:', error);
      if (active) setStorageError('Could not save changes to the vocabulary vault.');
    });
    return () => {
      active = false;
    };
  }, [vaultWords]);

  const toggleVault = useCallback((wordObj) => {
    if (!wordObj?.word) return;
    setVaultWords((current) => {
      const exists = current.some((word) => word.word.toLowerCase() === wordObj.word.toLowerCase());
      if (exists) {
        return current.filter((word) => word.word.toLowerCase() !== wordObj.word.toLowerCase());
      }

      const now = new Date();
      return [{
        ...wordObj,
        savedAt: now.toISOString(),
        srsIntervalDays: 3,
        nextReviewDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      }, ...current];
    });
  }, []);

  const isWordInVault = useCallback((word) => (
    vaultWords.some((item) => item.word.toLowerCase() === word?.toLowerCase())
  ), [vaultWords]);

  const rateRecall = useCallback((word, rating) => {
    const intervalDays = { easy: 7, medium: 3, hard: 1 }[rating];
    if (!intervalDays) return;

    setVaultWords((current) => current.map((item) => (
      item.word.toLowerCase() === word.toLowerCase()
        ? {
            ...item,
            srsIntervalDays: intervalDays,
            nextReviewDate: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString()
          }
        : item
    )));
  }, []);

  return { vaultWords, toggleVault, isWordInVault, rateRecall, storageError };
}
