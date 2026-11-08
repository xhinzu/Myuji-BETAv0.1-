import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettingsStore } from '../../stores/settingsStore';

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
  const { currentTrack, activeLyrics, activeLineIndex, activeWordIndex } = usePlayerStore();
  const { settings } = useSettingsStore();

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

      // Render subtle stars/particles
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
    };
  }, [settings.theme.motionLevel]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      onMouseMove={onUserActive}
      onClick={onUserActive}
    >
      {/* Background Starfield Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Main Lyrics Stage Area */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-12 py-20 text-center">
        {currentTrack && activeLyrics.length > 0 ? (
          <div className="max-w-3xl space-y-4">
            {activeLyrics.slice(Math.max(0, activeLineIndex - 2), activeLineIndex + 3).map((line, idx) => {
              const actualLineIdx = Math.max(0, activeLineIndex - 2) + idx;
              const isCurrent = actualLineIdx === activeLineIndex;

              return (
                <div
                  key={`${line.id}-${actualLineIdx}`}
                  className={`transition-all duration-300 font-bold ${
                    isCurrent
                      ? 'text-3xl md:text-5xl text-white scale-105 drop-shadow-[0_0_20px_var(--color-accent-glow)]'
                      : 'text-xl md:text-2xl text-white/30 filter blur-[0.5px]'
                  }`}
                >
                  {isCurrent && line.words && line.words.length > 0 ? (
                    <span className="inline-flex flex-wrap justify-center gap-x-2">
                      {line.words.map((w, wIdx) => {
                        const isWordActive = wIdx === activeWordIndex;
                        return (
                          <span
                            key={`${w.text}-${wIdx}`}
                            className={`transition-colors ${
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
