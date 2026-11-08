import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Move, Minimize2, Maximize2 } from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';

interface MiniLyricsHudProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MiniLyricsHud: React.FC<MiniLyricsHudProps> = ({ isOpen, onClose }) => {
  const { currentTrack, activeLyrics, activeLineIndex, activeWordIndex } = usePlayerStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen || !currentTrack) return null;

  const currentLine = activeLyrics[activeLineIndex];
  const nextLine = activeLyrics[activeLineIndex + 1];

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-8 z-50 w-96 bg-bg-surface/90 border border-accent/40 backdrop-blur-xl clip-chamfer shadow-2xl overflow-hidden select-none"
    >
      {/* Title bar / Drag Handle */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 border-b border-border-subtle cursor-move">
        <div className="flex items-center gap-1.5 min-w-0">
          <Move className="w-3 h-3 text-accent flex-shrink-0" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-300 truncate">
            {currentTrack.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-zinc-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Lyrics body */}
      {!isCollapsed && (
        <div className="p-4 space-y-2 text-center">
          {currentLine ? (
            <div className="space-y-1.5">
              {/* Current Active Line with Word Highlighting */}
              <div className="text-sm font-bold text-white flex flex-wrap justify-center gap-x-1.5 gap-y-0.5 leading-snug">
                {currentLine.words && currentLine.words.length > 0 ? (
                  currentLine.words.map((w, wIdx) => {
                    const isWordActive = wIdx === activeWordIndex;
                    const isWordPast = wIdx < activeWordIndex;
                    return (
                      <span
                        key={wIdx}
                        className={`transition-colors duration-150 ${
                          isWordActive
                            ? 'text-accent font-extrabold underline decoration-accent/60'
                            : isWordPast
                            ? 'text-white'
                            : 'text-zinc-500'
                        }`}
                      >
                        {w.text}
                      </span>
                    );
                  })
                ) : (
                  <span>{currentLine.text}</span>
                )}
              </div>

              {/* Next Line Preview */}
              {nextLine && (
                <div className="text-xs text-zinc-500 font-medium truncate italic mt-1">
                  {nextLine.text}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-zinc-500 font-mono py-2">
              ♪ Instrumentals / Waiting for vocal cues ♪
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
