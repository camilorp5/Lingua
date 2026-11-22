export default function SrsView({ word, clip, translations, uiLang, revealed, onReveal, onRate, onPlay }) {
  if (!word) return null;
  return (
    <div className="w-full h-full p-4 overflow-y-auto flex flex-col gap-5 bg-slate-950">
      <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
        <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
          {translations.step3Tag}
        </span>
        <h2 className="text-lg font-black mt-2 text-white">{translations.srsTitle}</h2>
        <p className="text-xs text-slate-400 mt-1">{translations.srsSubtitle}</p>
      </header>
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Palabra a repasar: {word.word}</span>
        <button type="button" onClick={onPlay} aria-label="Play review audio" className="w-16 h-16 rounded-full bg-indigo-600 text-white text-2xl">🔊</button>
        <p className="text-xs text-slate-400 italic">Reproduce el audio y trata de entender sin leer.</p>
        {revealed ? (
          <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2 mt-2">
            <p className="text-sm font-semibold text-white">{clip?.targetSentence}</p>
            <p className="text-xs text-slate-400 italic">{clip?.translations?.[uiLang] || clip?.translations?.es}</p>
          </div>
        ) : (
          <button type="button" onClick={onReveal} className="w-full py-2.5 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl">
            {translations.revealSubtitles}
          </button>
        )}
      </section>
      {revealed && (
        <section className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 text-center">{translations.rateRecall}</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['easy', translations.easy, 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'],
              ['medium', translations.medium, 'bg-amber-950/80 border-amber-500/40 text-amber-300'],
              ['hard', translations.hard, 'bg-rose-950/80 border-rose-500/40 text-rose-300']
            ].map(([rating, label, colors]) => (
              <button
                type="button"
                key={rating}
                onClick={() => onRate(rating)}
                className={`py-2.5 border text-xs font-bold rounded-xl ${colors}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
