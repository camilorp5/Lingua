import { useState, useEffect, useRef } from 'react';
import ReelCard from './ReelCard';

export default function ReelsFeed({
  word,
  clip,
  feedClips,
  isLoading,
  uiLang,
  hideTranslation,
  isSaved,
  playbackSpeed,
  onSetPlaybackSpeed,
  onToggleVault,
  onToggleTranslation,
  onSelectWord,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  // Extrae el array de clips desde `word.clips` o usa `clip` como respaldo
  const clips = Array.isArray(feedClips)
    ? feedClips
    : Array.isArray(word?.clips)
    ? word.clips
    : clip
      ? [clip]
      : [];

  const keyword = word?.word || '';

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [feedClips]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || clips.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.index));
          }
        });
      },
      { root: container, threshold: 0.7 }
    );

    const cards = container.querySelectorAll('[data-reel-card]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [feedClips, word?.word, clips.length]);

  if (isLoading && !feedClips) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-amber-300 text-sm font-semibold">
        Buscando Reels reales en YouTube...
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-slate-400 p-6 text-center">
        <p className="text-sm font-semibold">No hay clips disponibles para esta palabra</p>
        <p className="text-xs text-slate-500 mt-1">
          Prueba con otro idioma o palabra.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none bg-black"
    >
      {clips.map((item, index) => (
        <div
          key={item.id || index}
          data-reel-card
          data-index={index}
          className="w-full h-full snap-start shrink-0 relative"
        >
          <ReelCard
            clip={item}
            keyword={item.keyword || keyword}
            isActive={index === activeIndex}
            uiLang={uiLang}
            hideTranslation={hideTranslation}
            isSaved={isSaved}
            playbackSpeed={playbackSpeed}
            onSetPlaybackSpeed={onSetPlaybackSpeed}
            onToggleTranslation={onToggleTranslation}
            onSaveVault={onToggleVault}
            onWordTap={(cleanWord, sentenceContext) =>
              onSelectWord?.({ word: cleanWord, sentenceContext })
            }
          />
        </div>
      ))}
    </div>
  );
}