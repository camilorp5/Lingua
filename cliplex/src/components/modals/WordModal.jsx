import { useEffect, useState } from 'react';
import { lookupWord } from '../../services/apiClient.js';

export default function WordModal({ selection, uiLang, translations, fallbackMeaning, onClose, onPlay, onSave }) {
  const [definition, setDefinition] = useState(fallbackMeaning || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!selection?.word) return undefined;
    const controller = new AbortController();
    lookupWord({
      word: selection.word,
      sentenceContext: selection.sentenceContext,
      targetLang: selection.targetLang,
      uiLang
    }, controller.signal).then((result) => {
      if (!controller.signal.aborted) setDefinition(result.definition);
    }).catch((requestError) => {
      if (!controller.signal.aborted) setError(requestError.message);
    });
    return () => controller.abort();
  }, [selection, uiLang]);

  if (!selection) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-modal-title"
        className="w-full bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 flex flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 id="word-modal-title" className="text-2xl font-black text-amber-300">{selection.word}</h2>
            <p className="text-xs text-slate-400 font-mono">Significado en contexto</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dictionary" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold">
            ✕
          </button>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <p className="text-sm text-slate-200">{definition || 'Buscando significado…'}</p>
          {error && <p role="alert" className="text-xs text-rose-300 mt-2">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onPlay} className="flex-1 py-2.5 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl">
            🔊 {translations.pronounce}
          </button>
          <button type="button" onClick={onSave} className="flex-1 py-2.5 bg-amber-400 text-slate-950 text-xs font-black rounded-xl">
            🔖 {translations.saveToVault}
          </button>
        </div>
      </section>
    </div>
  );
}
