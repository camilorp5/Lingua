export default function FrictionView({
  word,
  clip,
  translations,
  clozeInput,
  onClozeInput,
  onCheckAnswer,
  clozeFeedback,
  onVoiceInput,
  isListeningSpeech,
  userSentence,
  onUserSentence,
  onEvaluate,
  isEvaluating,
  evaluation,
  onPlayMuted,
  error
}) {
  if (!word) return null;
  const mutedSentence = clip?.targetSentence?.replace(
    new RegExp(word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
    '_____'
  ) || '';

  return (
    <div className="w-full h-full p-4 overflow-y-auto flex flex-col gap-6 bg-slate-950">
      <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl p-4">
        <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          {translations.step2Tag}
        </span>
        <h2 className="text-xl font-black mt-2 text-white">
          Desafío para: <span className="text-amber-300">{word.word}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">Obliga a tu cerebro a recordar activamente la palabra.</p>
      </div>
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-200">1. Clip silenciado</h3>
          <button type="button" onClick={onPlayMuted} className="text-xs font-bold text-slate-950 bg-amber-400 px-3 py-1 rounded-lg">
            ▶ Listening Muted
          </button>
        </div>
        <div className="bg-slate-950 p-3 rounded-xl text-center border border-slate-800 font-medium text-sm text-slate-300">
          "{mutedSentence}"
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <input
            type="text"
            value={clozeInput}
            onChange={(event) => onClozeInput(event.target.value)}
            placeholder={translations.typePlaceholder}
            className="min-w-0 flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={onVoiceInput}
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${
              isListeningSpeech ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            {isListeningSpeech ? '🎙️ ...' : translations.speakBtn}
          </button>
          <button type="button" onClick={onCheckAnswer} className="bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs">
            {translations.checkAnswer}
          </button>
        </div>
        {clozeFeedback && (
          <div className={`p-3 rounded-xl text-xs font-bold ${
            clozeFeedback === 'correct'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
          }`}>
            {clozeFeedback === 'correct' ? `✅ ${translations.correct}` : `❌ ${translations.tryAgain}`}
          </div>
        )}
      </section>
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-slate-200">
          2. {translations.createSentenceTitle} "{word.word}"
        </h3>
        <textarea
          value={userSentence}
          onChange={(event) => onUserSentence(event.target.value)}
          placeholder={translations.sentencePlaceholder}
          rows={3}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white"
        />
        <button
          type="button"
          onClick={onEvaluate}
          disabled={isEvaluating || !userSentence.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs disabled:opacity-50"
        >
          {isEvaluating ? '⏳' : translations.validateWithAI}
        </button>
        {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
        {evaluation && (
          <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3 text-xs flex flex-col gap-2">
            <p className="font-bold text-purple-300">{translations.aiScore}: {evaluation.score}%</p>
            <p className="text-slate-300"><strong>{translations.aiFeedback}</strong> {evaluation.feedback}</p>
            <p className="text-slate-300"><strong>{translations.aiAlternative}</strong> <em className="text-amber-300">"{evaluation.alternative}"</em></p>
          </div>
        )}
      </section>
    </div>
  );
}
