import React, { useState, useEffect } from 'react';
import {
  X,
  FileEdit,
  Sparkles,
  Check,
  Type,
  ExternalLink,
} from 'lucide-react';
import {
  parseEnhancedLrc,
  fixAllCapsLrc,
  ParseEnhancedLrcResult,
} from '@myujiku/shared';
import { usePlayerStore } from '../../stores/playerStore';
import { LyricsManager } from '../../lyrics/LyricsManager';

interface EditLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditLyricsModal: React.FC<EditLyricsModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack, activeLyrics, setActiveLyrics } = usePlayerStore();
  const lyricsManager = LyricsManager.getInstance();

  const [rawText, setRawText] = useState('');
  const [parseResult, setParseResult] = useState<ParseEnhancedLrcResult | null>(null);
  const [fixApplied, setFixApplied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (activeLyrics.length > 0) {
        // Reconstruct or extract text
        const reconstructed = activeLyrics
          .map((line) => {
            const hasWords = line.words && line.words.length > 0;
            if (hasWords) {
              const wordTags = line.words
                .map((w) => {
                  const m = Math.floor(w.start / 60);
                  const s = Math.floor(w.start % 60);
                  const ms = Math.floor((w.start % 1) * 100);
                  return `<${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}> ${w.text}`;
                })
                .join(' ');
              const lm = Math.floor(line.start / 60);
              const ls = Math.floor(line.start % 60);
              const lms = Math.floor((line.start % 1) * 100);
              return `[${lm.toString().padStart(2, '0')}:${ls.toString().padStart(2, '0')}.${lms.toString().padStart(2, '0')}] ${wordTags}`;
            }
            const lm = Math.floor(line.start / 60);
            const ls = Math.floor(line.start % 60);
            const lms = Math.floor((line.start % 1) * 100);
            return `[${lm.toString().padStart(2, '0')}:${ls.toString().padStart(2, '0')}.${lms.toString().padStart(2, '0')}] ${line.text}`;
          })
          .join('\n');
        setRawText(reconstructed);
      } else {
        setRawText('');
      }
    }
  }, [isOpen, activeLyrics]);

  useEffect(() => {
    if (rawText) {
      const res = parseEnhancedLrc(rawText, { songDuration: currentTrack?.duration });
      setParseResult(res);
    } else {
      setParseResult(null);
    }
  }, [rawText, currentTrack]);

  if (!isOpen || !currentTrack) return null;

  const handleFixAllCaps = () => {
    const fixed = fixAllCapsLrc(rawText);
    setRawText(fixed);
    setFixApplied(true);
    setTimeout(() => setFixApplied(false), 2000);
  };

  const handleApply = () => {
    if (!parseResult) return;
    lyricsManager.setCustomLyrics(currentTrack, rawText);
    setActiveLyrics(parseResult.lines);
    onClose();
  };

  const handleOpenLyricsify = () => {
    lyricsManager.openLyricsifySearch(`${currentTrack.title} ${currentTrack.artist}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Add or Edit Lyrics"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-bg-surface/95 border border-border-base backdrop-blur-2xl clip-chamfer shadow-2xl p-6 flex flex-col gap-4 max-h-[88vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <FileEdit className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Add or Edit Lyrics
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                {currentTrack.title} — {currentTrack.artist}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Syntax badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFixAllCaps}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs font-semibold text-zinc-200 transition-colors"
              title="Fix ALL CAPS lyrics with sentence casing while preserving lexicon proper nouns & timestamps"
            >
              {fixApplied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Type className="w-3.5 h-3.5 text-accent" />
              )}
              <span>{fixApplied ? 'Fixed!' : 'Fix ALL CAPS'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenLyricsify}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <span>Search on Lyricsify</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            {parseResult ? (
              <>
                <span className="px-2 py-0.5 rounded bg-bg-elevated border border-border-subtle text-zinc-300">
                  {parseResult.lines.length} lines
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    parseResult.format === 'enhanced'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : parseResult.format === 'lrc'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {parseResult.format}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* Lyric Editor Textarea */}
        <div className="flex-1 min-h-[300px] relative">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste standard [mm:ss.xx] or Enhanced <mm:ss.xx> LRC lyrics here..."
            className="w-full h-full p-3 bg-bg-base border border-border-base clip-chamfer font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-accent resize-none leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Word-level timing will be automatically derived for standard line-level LRC.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-bg-elevated hover:bg-white/10 clip-chamfer-sm text-xs font-semibold text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!parseResult || parseResult.lines.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider clip-chamfer-sm transition-all shadow-[0_0_12px_var(--color-accent-glow)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Lyrics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

