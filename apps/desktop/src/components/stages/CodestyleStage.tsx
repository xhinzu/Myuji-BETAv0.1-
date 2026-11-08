import React, { useState, useEffect } from 'react';
import { SyncedLyricLine } from '@myujiku/shared';

interface CodestyleStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const CodestyleStage: React.FC<CodestyleStageProps> = ({
  lyrics,
  activeLineIndex,
  activeWordIndex,
  onSeek,
}) => {
  const [caretVisible, setCaretVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCaretVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const formatLineNum = (num: number) => num.toString().padStart(3, '0');

  return (
    <div className="max-w-3xl w-full bg-black/80 border border-emerald-500/30 clip-chamfer p-6 font-mono text-left shadow-2xl backdrop-blur-md select-none">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="ml-2 text-emerald-400/80 font-mono text-[11px]">myujiku_live_stage.ts</span>
        </div>
        <span className="text-[10px] text-zinc-600">UTF-8 • TypeScript</span>
      </div>

      {/* Code Lines */}
      <div className="space-y-2 text-xs md:text-sm leading-relaxed">
        {lyrics
          .slice(Math.max(0, activeLineIndex - 2), activeLineIndex + 3)
          .map((line, idx) => {
            const actualLineIdx = Math.max(0, activeLineIndex - 2) + idx;
            const isCurrent = actualLineIdx === activeLineIndex;

            return (
              <div
                key={`${line.id}-${actualLineIdx}`}
                onClick={() => onSeek(line.start)}
                className={`flex items-start gap-4 cursor-pointer hover:bg-emerald-500/5 p-1 rounded transition-colors ${
                  isCurrent ? 'bg-emerald-500/10 border-l-2 border-emerald-400' : 'opacity-40'
                }`}
              >
                {/* Line number */}
                <span className="text-zinc-600 select-none font-mono text-xs w-8 text-right">
                  {formatLineNum(actualLineIdx + 1)}
                </span>

                {/* Code syntax */}
                <div className="flex-1 min-w-0">
                  <span className="text-purple-400">const</span>{' '}
                  <span className="text-blue-300">verse_{formatLineNum(actualLineIdx + 1)}</span>
                  <span className="text-zinc-400">:</span> <span className="text-emerald-300">LyricToken</span>{' '}
                  <span className="text-zinc-400">=</span>{' '}
                  <span className="text-amber-200">"</span>
                  {isCurrent && line.words && line.words.length > 0 ? (
                    <span className="inline-flex flex-wrap gap-x-1.5 font-bold">
                      {line.words.map((w, wIdx) => {
                        const isWordActive = wIdx === activeWordIndex;
                        return (
                          <span
                            key={wIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSeek(w.start);
                            }}
                            className={
                              isWordActive
                                ? 'text-emerald-300 underline decoration-emerald-400 underline-offset-4'
                                : 'text-zinc-200'
                            }
                          >
                            {w.text}
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    <span className="text-amber-200">{line.text}</span>
                  )}
                  <span className="text-amber-200">"</span>
                  <span className="text-zinc-400">;</span>
                  {isCurrent && (
                    <span
                      className={`inline-block ml-1 text-emerald-400 ${
                        caretVisible ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      ▋
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

