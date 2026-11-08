import React, { useMemo } from 'react';
import { SyncedLyricLine, precomputeVisualTimeline } from '@myujiku/shared';
import { Sparkles, Flame, Heart, Music, CloudRain, Star, Wind } from 'lucide-react';

interface VisualStageProps {
  lyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  onSeek: (seconds: number) => void;
}

export const VisualStage: React.FC<VisualStageProps> = ({
  lyrics,
  activeLineIndex,
  activeWordIndex,
  onSeek,
}) => {
  // Precompute visual concept cues from lexicon
  const timeline = useMemo(() => {
    return precomputeVisualTimeline(lyrics, { frequency: 'normal' });
  }, [lyrics]);

  const cuesByLine = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const cue of timeline.cues) {
      const existing = map.get(cue.lineIndex) || [];
      existing.push(cue.conceptId);
      map.set(cue.lineIndex, existing);
    }
    return map;
  }, [timeline]);

  const getConceptIcon = (id: string) => {
    const lower = id.toLowerCase();
    if (lower.includes('rain') || lower.includes('water')) return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
    if (lower.includes('fire') || lower.includes('sun') || lower.includes('burn')) return <Flame className="w-3.5 h-3.5 text-orange-400" />;
    if (lower.includes('love') || lower.includes('heart')) return <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/30" />;
    if (lower.includes('star') || lower.includes('space') || lower.includes('night')) return <Star className="w-3.5 h-3.5 text-amber-300" />;
    if (lower.includes('music') || lower.includes('sound') || lower.includes('song')) return <Music className="w-3.5 h-3.5 text-purple-400" />;
    if (lower.includes('wind') || lower.includes('air')) return <Wind className="w-3.5 h-3.5 text-cyan-300" />;
    return <Sparkles className="w-3.5 h-3.5 text-accent" />;
  };

  return (
    <div className="max-w-3xl w-full space-y-6 px-6">
      {lyrics
        .slice(Math.max(0, activeLineIndex - 2), activeLineIndex + 3)
        .map((line, idx) => {
          const actualLineIdx = Math.max(0, activeLineIndex - 2) + idx;
          const isCurrent = actualLineIdx === activeLineIndex;
          const lineConcepts = cuesByLine.get(actualLineIdx) || [];

          return (
            <div
              key={`${line.id}-${actualLineIdx}`}
              onClick={() => onSeek(line.start)}
              title="Click to seek"
              className={`transition-all duration-300 font-bold cursor-pointer select-none flex flex-col items-center gap-2 ${
                isCurrent
                  ? 'text-3xl md:text-5xl text-white scale-105 drop-shadow-[0_0_25px_var(--color-accent-glow)]'
                  : 'text-xl md:text-2xl text-white/30 filter blur-[0.6px] hover:blur-none hover:text-white/60'
              }`}
            >
              {/* Concept Badges Row */}
              {isCurrent && lineConcepts.length > 0 && (
                <div className="flex items-center gap-2 mb-1 animate-fade-in">
                  {lineConcepts.slice(0, 3).map((concept, cIdx) => (
                    <span
                      key={cIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bg-surface/80 border border-accent/40 text-[11px] font-mono font-medium text-white shadow-sm"
                    >
                      {getConceptIcon(concept)}
                      <span className="capitalize">{concept.replace(/_/g, ' ')}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Word Tokens */}
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
                <span>{line.text}</span>
              )}
            </div>
          );
        })}
    </div>
  );
};
