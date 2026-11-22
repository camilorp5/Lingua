import { useState, useEffect, useMemo, useRef } from 'react';
import ReelCard from './ReelCard';

export default function ReelsFeed({
  word,
  clip,
  feedClips,
  activeProfileId,
  targetLang,
  isVideoWatched,
  isLoading,
  uiLang,
  hideTranslation,
  isSaved,
  playbackSpeed,
  onSetPlaybackSpeed,
  onToggleVault,
  onToggleTranslation,
  onSelectWord,
  onVideoWatched,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const isVideoWatchedRef = useRef(isVideoWatched);
  const wordClips = word?.clips;

  const sourceClips = useMemo(() => (
    Array.isArray(feedClips)
      ? feedClips
      : Array.isArray(wordClips)
        ? wordClips
        : clip
          ? [clip]
          : []
  ), [feedClips, wordClips, clip]);
  const [clips, setClips] = useState(sourceClips);

  const keyword = word?.word || '';

  useEffect(() => {
    isVideoWatchedRef.current = isVideoWatched;
  }, [isVideoWatched]);

  useEffect(() => {
    const unseen = [];
    const seen = [];
    sourceClips.forEach((item) => {
      const isSeen = item.videoId && isVideoWatchedRef.current?.(targetLang, item.videoId);
      (isSeen ? seen : unseen).push(item);
    });
    setClips([...unseen, ...seen]);
  }, [sourceClips, word?.word, activeProfileId, targetLang]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [feedClips, word?.word, activeProfileId]);

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
  }, [clips, feedClips, word?.word]);

  function wrapFeedIfComplete() {
    const container = containerRef.current;
    if (!container || clips.length < 2) return false;
    const atEnd = container.scrollTop + container.clientHeight >= container.scrollHeight - 2;
    const allWatched = clips.every((item) => (
      item.videoId && isVideoWatchedRef.current?.(targetLang, item.videoId)
    ));
    if (atEnd && allWatched) {
      container.scrollTop = 0;
      return true;
    }
    return false;
  }

  function handleFeedScroll() {
    wrapFeedIfComplete();
  }

  function handleFeedWheel(event) {
    if (event.deltaY > 0) wrapFeedIfComplete();
  }

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
        <p className="text-sm font-semibold">No hay clips nuevos disponibles para esta palabra</p>
        <p className="text-xs text-slate-500 mt-1">
          Prueba otra palabra o cambia de perfil para consultar su historial.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleFeedScroll}
      onWheel={handleFeedWheel}
      onTouchEnd={wrapFeedIfComplete}
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
            onVideoWatched={onVideoWatched}
            onWordTap={(cleanWord, sentenceContext) =>
              onSelectWord?.({ word: cleanWord, sentenceContext })
            }
          />
        </div>
      ))}
    </div>
  );
}