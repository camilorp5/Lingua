export default function VaultView({ words, uiLang, translations, onGenerateClips, isGenerating, onRemove }) {
  return (
    <div className="w-full h-full p-4 overflow-y-auto flex flex-col gap-4 bg-slate-950">
      <header className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-black text-white">{translations.vault}</h2>
          <p className="text-xs text-slate-400">{words.length} palabras guardadas</p>
        </div>
      </header>
      {words.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
          <span className="text-3xl">📦</span>
          <p className="max-w-[200px]">{translations.emptyVault}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {words.map((word) => (
            <article key={`${word.word}-${word.savedAt}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3">
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onGenerateClips(word.word)}
                  disabled={isGenerating}
                  className="bg-purple-900/60 border border-purple-500/40 text-purple-300 hover:bg-purple-800 text-xs font-bold px-3 py-1.5 rounded-xl disabled:opacity-50"
                >
                  {translations.generateAIClips}
                </button>
                <button type="button" onClick={() => onRemove(word)} aria-label={`Remove ${word.word}`} className="text-slate-400 px-2">
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
