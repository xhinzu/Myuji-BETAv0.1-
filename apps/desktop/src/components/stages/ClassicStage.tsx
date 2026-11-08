import React from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface ClassicStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const ClassicStage: React.FC<ClassicStageProps> = ({
  lyrics,
  activeLineIndex,
  activeWordIndex,
  onSeek,
}) => {
  return (
    <div className="max-w-3xl w-full space-y-5 px-6">
      {lyrics
        .slice(Math.max(0, activeLineIndex - 2), activeLineIndex + 3)
        .map((line, idx) => {
          const actualLineIdx = Math.max(0, activeLineIndex - 2) + idx;
          const isCurrent = actualLineIdx === activeLineIndex;

          return (
            <div
              key={`${line.id}-${actualLineIdx}`}
              onClick={() => onSeek(line.start)}
              title="Click to seek"
              className={`transition-all duration-300 font-bold cursor-pointer select-none ${
                isCurrent
                  ? 'text-3xl md:text-5xl text-white scale-105 drop-shadow-[0_0_25px_var(--color-accent-glow)]'
                  : 'text-xl md:text-2xl text-white/30 filter blur-[0.6px] hover:blur-none hover:text-white/60'
              }`}
            >
              {isCurrent && line.words && line.words.length > 0 ? (
                <span className="inline-flex flex-wrap justify-center gap-x-2">
                  {line.words.map((w, wIdx) => {
                    const isWordActive = wIdx === activeWordIndex;
                    const isWordPast = wIdx < activeWordIndex;
                    return (
                      <span
                        key={`${w.text}-${wIdx}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeek(w.start);
                        }}
                        className={`transition-colors duration-150 ${
                          isWordActive
                            ? 'text-accent underline decoration-accent/70 underline-offset-8 scale-105 inline-block'
                            : isWordPast
                            ? 'text-white'
                            : 'text-zinc-400'
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
  );
};

