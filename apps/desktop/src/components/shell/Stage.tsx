import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { RotateCw } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  alphaTarget: number;
}

export const Stage: React.FC<{ onUserActive?: () => void }> = ({ onUserActive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    currentTrack,
    activeLyrics,
    activeLineIndex,
    activeWordIndex,
    lyricTransform,
    setLyricTransform,
    seek,
  } = usePlayerStore();
  const { settings } = useSettingsStore();

  const [isManualScroll, setIsManualScroll] = useState(false);
  const [manualScrollLineIndex, setManualScrollLineIndex] = useState(0);
  const manualScrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard Nudge: [ and ] for -0.1s / +0.1s
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '[') {
        e.preventDefault();
        const next = Number((lyricTransform.offset - 0.1).toFixed(2));
        setLyricTransform({ offset: next });
      } else if (e.key === ']') {
        e.preventDefault();
        const next = Number((lyricTransform.offset + 0.1).toFixed(2));
        setLyricTransform({ offset: next });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lyricTransform.offset, setLyricTransform]);

  // Handle manual scroll with 4-second pause
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (activeLyrics.length === 0) return;
      setIsManualScroll(true);
      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);

      const delta = e.deltaY > 0 ? 1 : -1;
      setManualScrollLineIndex((prev) => {
        const base = isManualScroll ? prev : activeLineIndex;
        return Math.max(0, Math.min(activeLyrics.length - 1, base + delta));
      });

      // 4-second pause before resuming auto-scroll
      manualScrollTimerRef.current = setTimeout(() => {
        setIsManualScroll(false);
      }, 4000);
    },
    [activeLyrics.length, isManualScroll, activeLineIndex]
  );

  const resumeAutoScroll = () => {
    if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    setIsManualScroll(false);
  };

  // Subtle ambient particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = settings.theme.motionLevel === 'off' ? 0 : 45;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.4 + 0.1,
        alphaTarget: Math.random() * 0.4 + 0.1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (manualScrollTimerRef.current) clearTimeout(manualScrollTimerRef.current);
    };
  }, [settings.theme.motionLevel]);

  const displayCenterIndex = isManualScroll ? manualScrollLineIndex : activeLineIndex;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onMouseMove={onUserActive}
      onClick={onUserActive}
      onWheel={handleWheel}
    >
      {/* Background Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Manual Scroll 4-second Pause Floating Indicator */}
      {isManualScroll && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-bg-surface/90 border border-accent/40 clip-chamfer-sm backdrop-blur-md flex items-center gap-2 text-xs text-zinc-300 animate-fade-in shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          <span>Auto-scroll paused</span>
          <button
            type="button"
            onClick={resumeAutoScroll}
            className="flex items-center gap-1 text-accent font-semibold hover:underline ml-1"
          >
            <RotateCw className="w-3 h-3" />
            <span>Resume</span>
          </button>
        </div>
      )}

      {/* Main Lyrics Stage Area */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-12 py-20 text-center">
        {currentTrack && activeLyrics.length > 0 ? (
          <div className="max-w-3xl space-y-4">
            {activeLyrics
              .slice(Math.max(0, displayCenterIndex - 2), displayCenterIndex + 3)
              .map((line, idx) => {
                const actualLineIdx = Math.max(0, displayCenterIndex - 2) + idx;
                const isCurrent = actualLineIdx === activeLineIndex;

                return (
                  <div
                    key={`${line.id}-${actualLineIdx}`}
                    onClick={() => seek(line.start)}
                    title="Click line to jump / calibrate"
                    className={`transition-all duration-300 font-bold cursor-pointer hover:opacity-100 ${
                      isCurrent
                        ? 'text-3xl md:text-5xl text-white scale-105 drop-shadow-[0_0_20px_var(--color-accent-glow)]'
                        : 'text-xl md:text-2xl text-white/30 filter blur-[0.5px] hover:blur-none'
                    }`}
                  >
                    {isCurrent && line.words && line.words.length > 0 ? (
                      <span className="inline-flex flex-wrap justify-center gap-x-2">
                        {line.words.map((w, wIdx) => {
                          const isWordActive = wIdx === activeWordIndex;
                          return (
                            <span
                              key={`${w.text}-${wIdx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                seek(w.start);
                              }}
                              className={`transition-colors cursor-pointer hover:underline ${
                                isWordActive
                                  ? 'text-accent underline decoration-accent/60 underline-offset-8'
                                  : 'text-white'
                              }`}
                            >
                              {w.text}
                            </span>
                          );
                        })}
                      </span>
                    ) : (
                      line.text
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          /* Ambient Idle State when no song is playing */
          <div className="flex flex-col items-center justify-center max-w-md text-center p-8 bg-bg-surface/40 backdrop-blur-md border border-border-subtle clip-chamfer animate-fade-in">
            <img
              src="/assets/logo.png"
              alt="MyuJiku Logo"
              className="w-16 h-16 object-contain mb-4 opacity-80 drop-shadow-[0_0_15px_var(--color-accent-glow)]"
            />
            <h2 className="text-xl font-bold tracking-wider uppercase text-white mb-2">
              MyuJiku Stage
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Select or search for a song, drop an audio file, or explore the library to start synchronized lyrics playback.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-accent">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>STAGE ACTIVE &bull; PRESS CTRL+K FOR ACTIONS</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
