import React from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface CameraStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const CameraStage: React.FC<CameraStageProps> = ({
  lyrics,
  activeLineIndex,
  activeWordIndex,
  onSeek,
}) => {
  const currentLine = lyrics[activeLineIndex];
  const prevLine = lyrics[activeLineIndex - 1];
  const nextLine = lyrics[activeLineIndex + 1];

  // Perspective camera rotation derived from line index
  const rotY = Math.sin(activeLineIndex * 0.8) * 8;
  const rotX = Math.cos(activeLineIndex * 0.6) * 6;

  return (
    <div
      className="max-w-4xl w-full flex flex-col items-center justify-center px-8 transition-transform duration-700 ease-out select-none"
      style={{
        perspective: '1000px',
        transform: `rotateY(${rotY}deg) rotateX(${rotX}deg)`,
      }}
    >
      {/* Previous line */}
      {prevLine && (
        <div
          onClick={() => onSeek(prevLine.start)}
          className="text-lg md:text-xl text-white/25 font-semibold mb-6 cursor-pointer filter blur-[0.8px] hover:blur-none transition-all"
        >
          {prevLine.text}
        </div>
      )}

      {/* Active Line (Kinetic Hero) */}
      {currentLine && (
        <div
          onClick={() => onSeek(currentLine.start)}
          className="text-4xl md:text-6xl font-extrabold text-white scale-110 drop-shadow-[0_0_35px_var(--color-accent-glow)] text-center cursor-pointer my-4 leading-tight"
        >
          {currentLine.words && currentLine.words.length > 0 ? (
            <span className="inline-flex flex-wrap justify-center gap-x-3">
              {currentLine.words.map((w, wIdx) => {
                const isWordActive = wIdx === activeWordIndex;
                const isWordPast = wIdx < activeWordIndex;
                return (
                  <span
                    key={`${w.text}-${wIdx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(w.start);
                    }}
                    className={`transition-all duration-200 ${
                      isWordActive
                        ? 'text-accent scale-110 underline decoration-accent/80 underline-offset-8 inline-block'
                        : isWordPast
                        ? 'text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    {w.text}
                  </span>
                );
              })}
            </span>
          ) : (
            currentLine.text
          )}
        </div>
      )}

      {/* Next line */}
      {nextLine && (
        <div
          onClick={() => onSeek(nextLine.start)}
          className="text-lg md:text-xl text-white/25 font-semibold mt-6 cursor-pointer filter blur-[0.8px] hover:blur-none transition-all"
        >
          {nextLine.text}
        </div>
      )}
    </div>
  );
};
