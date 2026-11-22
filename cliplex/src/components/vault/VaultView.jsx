import { useState } from 'react';

export default function VaultView({
  words,
  languages,
  targetLang,
  uiLang,
  translations,
  onAdd,
  onLanguageChange,
  onSearchAndMix,
  isSearching,
  onRemove
}) {
  const [newWord, setNewWord] = useState('');
  const [selectedWords, setSelectedWords] = useState([]);

  function addWord(event) {
    event.preventDefault();
    const word = newWord.trim();
    if (!word) return;
    onAdd({ word, phonetic: '', dictionaryMeaning: {} }, targetLang);
    setSelectedWords((current) => (
      current.some((selected) => selected.toLowerCase() === word.toLowerCase())
        ? current
        : [word, ...current]
    ));
    setNewWord('');
  }

  function toggleSelectedWord(word) {
    setSelectedWords((current) => (
      current.some((selected) => selected.toLowerCase() === word.toLowerCase())
        ? current.filter((selected) => selected.toLowerCase() !== word.toLowerCase())
        : [...current, word]
    ));
  }

  return (
    <div className="w-full h-full p-4 overflow-y-auto flex flex-col gap-4 bg-slate-950">
      <header className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-black text-white">{translations.vault}</h2>
          <p className="text-xs text-slate-400">{words.length} palabras guardadas</p>
        </div>
        <select
          aria-label="Idioma de la bóveda"
          value={targetLang}
          onChange={(event) => {
            setSelectedWords([]);
            onLanguageChange(event.target.value);
          }}
          className="max-w-36 rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white"
        >
          {languages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.flag} {language.name}
            </option>
          ))}
        </select>
      </header>

      <form onSubmit={addWord} className="flex gap-2">
        <input
          value={newWord}
          onChange={(event) => setNewWord(event.target.value)}
          placeholder="Añadir una palabra"
          aria-label="Nueva palabra"
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!newWord.trim()}
          className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
        >
          Añadir
        </button>
      </form>

      {words.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
          <span className="text-3xl">📦</span>
          <p className="max-w-[200px]">{translations.emptyVault}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {words.map((word) => (
            <article key={`${word.word}-${word.savedAt}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedWords.some((selected) => selected.toLowerCase() === word.word.toLowerCase())}
                  onChange={() => toggleSelectedWord(word.word)}
                  aria-label={`Buscar clips para ${word.word}`}
                  className="mt-1 accent-amber-400"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-amber-300">{word.word}</h3>
                    <span className="text-xs font-mono text-slate-400">{word.phonetic}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {word.dictionaryMeaning?.[uiLang] || word.dictionaryMeaning?.es || word.slangContext}
                  </p>
                  {word.nextReviewDate && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Próximo repaso: {new Date(word.nextReviewDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWords((current) => current.filter(
                      (selected) => selected.toLowerCase() !== word.word.toLowerCase()
                    ));
                    onRemove(word);
                  }}
                  aria-label={`Remove ${word.word}`}
                  className="text-slate-400 px-2"
                >
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onSearchAndMix(targetLang, selectedWords)}
        disabled={isSearching || selectedWords.length === 0}
        className="sticky bottom-0 rounded-2xl bg-purple-500 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"
      >
        {isSearching ? 'Buscando clips…' : `Buscar y mezclar clips (${selectedWords.length})`}
      </button>
    </div>
  );
}
