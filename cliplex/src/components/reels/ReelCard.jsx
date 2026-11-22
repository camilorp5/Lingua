import { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';

export default function ReelCard({
  clip,
  keyword,
  isActive,
  shouldMountPlayer = true,
  hideTranslation = false,
  onWordTap,
}) {
  const playerRef = useRef(null);
  const isPlayerReadyRef = useRef(false);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [pauseIndicator, setPauseIndicator] = useState('hidden');
  const [playbackRate, setPlaybackRate] = useState(1);
  // 'height' = llena el alto y recorta horizontales | 'width' = ajusta al ancho sin recortar
  const [fitMode, setFitMode] = useState('height');

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !isPlayerReadyRef.current || !clip?.videoId) return;

    try {
      if (isActive) {
        if (typeof clip.startSec === 'number') {
          player.seekTo(clip.startSec, true);
        }
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    } catch {
      // Evita errores si el iframe se está desmontando
    }
  }, [isActive, clip?.videoId, clip?.startSec]);

  useEffect(() => {
    if (!isActive || !clip?.endSec) return;

    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || !isPlayerReadyRef.current) return;

      try {
        if (typeof player.getCurrentTime === 'function') {
          const current = player.getCurrentTime();
          const start = clip.startSec || 0;
          if (current >= clip.endSec || current < start - 0.5) {
            player.seekTo(start, true);
          }
        }
      } catch {
        // Ignora errores transitorios del widget de YouTube
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isActive, clip?.startSec, clip?.endSec]);

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    const player = playerRef.current;
    if (player && isPlayerReadyRef.current && typeof player.setPlaybackRate === 'function') {
      try {
        player.setPlaybackRate(speed);
      } catch {
        // Ignora si el video actual no soporta esa velocidad
      }
    }
  };

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player || !isPlayerReadyRef.current) return;

    try {
      const state = player.getPlayerState();
      if (state === 1 || state === 3) {
        player.pauseVideo();
        setPauseIndicator('visible');
      } else {
        setPauseIndicator('hidden');
        player.playVideo();
      }
    } catch {
      setPauseIndicator('hidden');
    }
  };

  const handleScreenClick = (event) => {
    if (event.target.closest('button, a, input, select, textarea, [data-no-playback-toggle]')) return;
    togglePlayback();
  };

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: isActive ? 1 : 0,
      start: clip?.startSec || 0,
      end: clip?.endSec,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      enablejsapi: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  };

  // Clases de encuadre para el contenedor del video
  const frameClass =
    fitMode === 'height'
      ? 'absolute inset-0 pointer-events-none scale-[1.85] origin-center transition-transform duration-300'
      : 'w-full aspect-video pointer-events-none transition-all duration-300';

  return (
    <div
      className="w-full h-full relative bg-black overflow-hidden flex items-center justify-center"
      onClick={handleScreenClick}
    >
      {clip?.videoId ? (
        shouldMountPlayer ? (
          <div className={frameClass}>
            <YouTube
              key={`${clip.id || clip.videoId}-${fitMode}`}
              videoId={clip.videoId}
              opts={opts}
              className="w-full h-full"
              iframeClassName="w-full h-full"
              onReady={(e) => {
                playerRef.current = e.target;
                isPlayerReadyRef.current = true;
                setIsPlayerReady(true);
                try {
                  e.target.setPlaybackRate(playbackRate);
                  if (isActive) {
                    if (typeof clip.startSec === 'number') {
                      e.target.seekTo(clip.startSec, true);
                    }
                    e.target.playVideo();
                  }
                } catch {
                  // Ignora errores al inicializar
                }
              }}
              onStateChange={(e) => {
                if (e.data === 1) {
                  setPauseIndicator('hidden');
                }
                if (e.data === 0 && isActive) {
                  e.target.seekTo(clip.startSec || 0, true);
                  e.target.playVideo();
                }
              }}
              onError={() => setPauseIndicator('hidden')}
            />
          </div>
        ) : (
          <img
            src={`https://i.ytimg.com/vi/${clip.videoId}/hqdefault.jpg`}
            alt={clip.title || keyword}
            className={
              fitMode === 'height'
                ? 'w-full h-full object-cover scale-110 opacity-80'
                : 'w-full aspect-video object-contain opacity-80'
            }
          />
        )
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 px-6 text-center">
          <p className="text-sm font-semibold text-amber-300">
            No se encontró un video real para este clip
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Revisa los logs de tu terminal de backend para ver qué devolvió YouTube.
          </p>
        </div>
      )}

      {clip?.videoId && shouldMountPlayer && isPlayerReady && pauseIndicator !== 'hidden' && isActive && (
        <div
          aria-label="Video pausado"
          className={`pointer-events-none absolute left-1/2 top-1/2 z-30 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur-sm transition-opacity duration-200 ${
            pauseIndicator === 'visible' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
          </svg>
        </div>
      )}

      {/* Gradiente para mejorar contraste de texto */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90 pointer-events-none" />

      {/* Controles superiores: Creador, Encuadre (Alto/Ancho) y Velocidad */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md truncate max-w-[120px]">
          {clip?.creator || '@youtube'}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Selector de encuadre: Alto (recorte vertical) vs Ancho (completo) */}
          <div className="flex bg-black/70 p-0.5 rounded-lg border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setFitMode('height')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                fitMode === 'height' ? 'bg-amber-400 text-black' : 'text-slate-300'
              }`}
              title="Ajustar al alto (recorta los lados)"
            >
              Alto
            </button>
            <button
              type="button"
              onClick={() => setFitMode('width')}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                fitMode === 'width' ? 'bg-amber-400 text-black' : 'text-slate-300'
              }`}
              title="Ajustar al ancho (sin recortar)"
            >
              Ancho
            </button>
          </div>

          {/* Velocidad de reproducción */}
          <div className="flex bg-black/70 p-0.5 rounded-lg border border-white/10 backdrop-blur-md">
            {[0.75, 1, 1.25].map((spd) => (
              <button
                type="button"
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  playbackRate === spd ? 'bg-amber-400 text-black' : 'text-slate-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtítulos interactivos */}
      {clip?.targetSentence && (
        <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5">
          <p className="text-center text-sm sm:text-base font-semibold leading-snug text-white">
            {clip.targetSentence.split(' ').map((w, i) => {
              const clean = w.replace(/[.,!?"]/g, '');
              const isTarget = keyword && clean.toLowerCase() === keyword.toLowerCase();
              return (
                <span
                  key={i}
                  data-no-playback-toggle
                  onClick={(event) => {
                    event.stopPropagation();
                    onWordTap?.(clean, clip.targetSentence);
                  }}
                  className={`inline-block mx-0.5 px-1 rounded cursor-pointer transition-colors ${
                    isTarget ? 'bg-amber-400 text-black font-black' : 'hover:bg-white/20'
                  }`}
                >
                  {w}
                </span>
              );
            })}
          </p>
          {!hideTranslation && clip.translation && (
            <p className="text-xs text-slate-300 text-center italic mt-1.5">
              {clip.translation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}