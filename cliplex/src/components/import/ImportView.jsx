export default function ImportView({ translations, importUrl, onUrlChange, onImport, isLoading, lesson, error }) {
  return (
    <div className="w-full h-full p-4 overflow-y-auto flex flex-col gap-4 bg-slate-950">
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h2 className="text-lg font-black text-white">{translations.importTitle}</h2>
        <p className="text-xs text-slate-400 mt-1">{translations.importDesc}</p>
        <div className="flex flex-col gap-2 mt-4">
          <input
            type="url"
            value={importUrl}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder={translations.importPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          />
          <button
            type="button"
            onClick={onImport}
            disabled={isLoading || !importUrl.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs rounded-xl disabled:opacity-50"
          >
            {isLoading ? translations.analyzing : translations.processLink}
          </button>
        </div>
        {error && <p role="alert" className="text-xs text-rose-300 mt-3">{error}</p>}
      </section>
      {lesson && (
        <article className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-bold text-amber-400 uppercase">Lección generada</span>
          {lesson.ytId && (
            <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-800">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(lesson.ytId)}`}
                title="YouTube lesson video"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-xs font-bold text-amber-300">Palabra clave: {lesson.keyword}</p>
            <p className="text-sm font-semibold text-white mt-1">{lesson.targetSentence}</p>
            <p className="text-xs text-slate-400 italic mt-1">{lesson.translation}</p>
            {lesson.slangNote && <p className="text-xs text-slate-400 mt-2">{lesson.slangNote}</p>}
          </div>
        </article>
      )}
    </div>
  );
}
