export default function SubtitleBar({
  clip,
  keyword,
  uiLang,
  hideTranslation,
  translations,
  onToggleTranslation,
  onSelectWord,
  onNextClip,
  clipCount,
  clipIndex
}) {
  const sentence = clip?.targetSentence || '';
  const pieces = sentence.split(/(\s+)/);
  const clean = (word) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

  return (
    <div className="relative z-20 p-4 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-xl flex flex-col gap-3">
      <div className="text-center px-2">
        <div className="text-base sm:text-lg font-semibold leading-snug">
          {pieces.map((piece, index) => {
            if (/^\s+$/.test(piece)) return piece;
            const word = clean(piece);
            const isTarget = word.toLocaleLowerCase() === keyword?.toLocaleLowerCase();
            return (
              <button
                type="button"
                key={`${piece}-${index}`}
                onClick={() => onSelectWord({ word, sentenceContext: sentence })}
                className={`inline-block mx-0.5 px-1 py-0.5 rounded transition-all duration-150 hover:bg-yellow-400 hover:text-black ${
                  isTarget ? 'bg-amber-400 text-black font-extrabold' : 'text-white font-medium'
                }`}
              >
                {piece}
              </button>
            );
          })}
        </div>
        {!hideTranslation && (
          <p className="text-xs text-slate-400 mt-2 font-light italic border-t border-slate-800/60 pt-1.5">
            {clip?.translations?.[uiLang] || clip?.translations?.es || ''}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onToggleTranslation}
          className="text-[11px] font-medium text-slate-400 hover:text-amber-300"
        >
          {hideTranslation ? translations.showSub : translations.hideSub}
        </button>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: clipCount }, (_, index) => (
            <span
              key={index}
              aria-label={`Clip ${index + 1}`}
              className={`h-2 rounded-full ${clipIndex === index ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onNextClip}
          className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full hover:bg-amber-400 hover:text-slate-950"
        >
          Siguiente ➔
        </button>
      </div>
    </div>
  );
}
