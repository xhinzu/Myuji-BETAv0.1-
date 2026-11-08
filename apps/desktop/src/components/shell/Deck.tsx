import React, { useState } from 'react';
import {
  X,
  ListMusic,
  Gauge,
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  Crosshair,
  FileText,
  Sparkles,
  Layers,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useNavigationStore } from '../../stores/navigationStore';
import {
  speedToSliderValue,
  sliderValueToSpeed,
  DEFAULT_SPEED,
  DEFAULT_OFFSET,
} from '@myujiku/shared';

export const Deck: React.FC = () => {
  const {
    isDeckOpen,
    setDeckOpen,
    setWrongLyricsModalOpen,
    setEditLyricsModalOpen,
    setMiniLyricsHudOpen,
  } = useNavigationStore();
  const {
    currentTrack,
    currentTime,
    activeLyrics,
    activeLineIndex,
    queue,
    clearQueue,
    removeFromQueue,
    effects,
    toggleEffect,
    lyricTransform,
    setLyricTransform,
  } = usePlayerStore();

  const [activeDeckTab, setActiveDeckTab] = useState<'queue' | 'sync' | 'effects'>('sync');

  if (!isDeckOpen) return null;

  const currentSliderVal = speedToSliderValue(lyricTransform.speed);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const speed = sliderValueToSpeed(val);
    setLyricTransform({ speed });
  };

  const handleResetSpeed = () => {
    setLyricTransform({ speed: DEFAULT_SPEED });
  };

  const handleAdjustOffset = (delta: number) => {
    const next = Number((lyricTransform.offset + delta).toFixed(2));
    setLyricTransform({ offset: next });
  };

  const handleResetOffset = () => {
    setLyricTransform({ offset: DEFAULT_OFFSET });
  };

  // Tap-to-sync: align current line start to currentTime
  const handleTapToSync = () => {
    const activeLine = activeLyrics[activeLineIndex] || activeLyrics[0];
    if (activeLine) {
      const calculatedOffset = Number((activeLine.start - lyricTransform.speed * currentTime).toFixed(2));
      setLyricTransform({ offset: calculatedOffset });
    }
  };

  // Check duration mismatch
  const lastLine = activeLyrics[activeLyrics.length - 1];
  const lyricsDuration = lastLine ? lastLine.end : 0;
  const hasDurationMismatch =
    currentTrack &&
    currentTrack.duration > 0 &&
    lyricsDuration > 0 &&
    Math.abs(lyricsDuration - currentTrack.duration) > 5;
  const durationDiffSeconds = currentTrack ? Math.round(lyricsDuration - currentTrack.duration) : 0;

  return (
    <div
      role="dialog"
      aria-label="Expanded Playback Deck"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-bg-surface/95 border border-border-base backdrop-blur-2xl clip-chamfer shadow-2xl p-5 flex flex-col gap-4 animate-slide-up"
    >
      {/* Header with Tabs and Close */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveDeckTab('sync')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeDeckTab === 'sync'
                ? 'bg-accent text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Lyrics Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDeckTab('queue')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeDeckTab === 'queue'
                ? 'bg-accent text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Queue ({queue.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDeckTab('effects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeDeckTab === 'effects'
                ? 'bg-accent text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Audio FX</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setDeckOpen(false)}
          title="Close Deck"
          className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content: Lyrics Sync Calibration */}
      {activeDeckTab === 'sync' && (
        <div className="space-y-4">
          {/* Duration mismatch alert banner */}
          {hasDurationMismatch && (
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 clip-chamfer-sm flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Lyrics length differs by {durationDiffSeconds > 0 ? `+${durationDiffSeconds}` : durationDiffSeconds}s from audio.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWrongLyricsModalOpen(true)}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-white rounded text-[11px] font-semibold"
              >
                Pick Version
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
              <span className="font-medium">Lyric Speed Transform</span>
              <button
                type="button"
                onClick={handleResetSpeed}
                title="Double click or click to reset to 1.00x"
                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lyricTransform.speed.toFixed(2)}x (Reset)</span>
              </button>
            </div>
            {/* Tiny log-scale speed slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={currentSliderVal}
              onChange={handleSliderChange}
              onDoubleClick={handleResetSpeed}
              title="Logarithmic speed slider (0.5x to 2.0x, double-click to reset)"
              className="w-full h-1.5 accent-accent bg-white/10 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono mt-1">
              <span>0.50x (Slow)</span>
              <span>1.00x (Normal)</span>
              <span>2.00x (Fast)</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">Manual Offset</span>
                <span className="text-[10px] text-zinc-500 font-mono">([ and ] to nudge)</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {lyricTransform.offset >= 0 ? `+${lyricTransform.offset.toFixed(2)}` : lyricTransform.offset.toFixed(2)}s
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAdjustOffset(-1.0)}
                className="px-2 py-1 text-xs bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300"
              >
                -1.0s
              </button>
              <button
                type="button"
                onClick={() => handleAdjustOffset(-0.5)}
                className="px-2 py-1 text-xs bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300"
              >
                -0.5s
              </button>
              <button
                type="button"
                onClick={handleTapToSync}
                className="flex-1 py-1 text-xs bg-accent hover:bg-accent-hover text-white font-bold clip-chamfer-sm flex items-center justify-center gap-1 shadow-[0_0_8px_var(--color-accent-glow)]"
                title="Calibrate offset so the active line timestamp matches audio playhead"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Tap to Sync</span>
              </button>
              <button
                type="button"
                onClick={handleResetOffset}
                className="px-2.5 py-1 text-xs bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-accent font-medium text-center"
              >
                0.0s
              </button>
              <button
                type="button"
                onClick={() => handleAdjustOffset(+0.5)}
                className="px-2 py-1 text-xs bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300"
              >
                +0.5s
              </button>
              <button
                type="button"
                onClick={() => handleAdjustOffset(+1.0)}
                className="px-2 py-1 text-xs bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300"
              >
                +1.0s
              </button>
            </div>
          </div>

          {/* Quick Lyrics Tools Row */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWrongLyricsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300 hover:text-white"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Wrong Lyrics?</span>
              </button>
              <button
                type="button"
                onClick={() => setEditLyricsModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300 hover:text-white"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Edit LRC</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMiniLyricsHudOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-accent hover:text-white"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mini HUD</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Queue */}
      {activeDeckTab === 'queue' && (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {queue.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              The queue is currently empty. Add tracks from Discover or Library.
            </p>
          ) : (
            <>
              <div className="flex justify-end pb-1">
                <button
                  type="button"
                  onClick={clearQueue}
                  className="text-[11px] text-zinc-400 hover:text-red-400 transition-colors"
                >
                  Clear Queue
                </button>
              </div>
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="flex items-center justify-between p-2 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{track.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromQueue(idx)}
                    className="p-1 text-zinc-400 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Tab Content: Audio Effects Quick Toggles */}
      {activeDeckTab === 'effects' && (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => toggleEffect('eightD')}
            className={`p-3 text-left border clip-chamfer-sm transition-all ${
              effects.eightD
                ? 'bg-accent/20 border-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]'
                : 'bg-bg-elevated/60 border-border-subtle text-zinc-400 hover:text-white'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">8D Audio</p>
            <p className="text-[10px] text-zinc-400 mt-1">Spatial spherical rotation</p>
          </button>

          <button
            type="button"
            onClick={() => toggleEffect('muffled')}
            className={`p-3 text-left border clip-chamfer-sm transition-all ${
              effects.muffled
                ? 'bg-accent/20 border-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]'
                : 'bg-bg-elevated/60 border-border-subtle text-zinc-400 hover:text-white'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">Muffled Filter</p>
            <p className="text-[10px] text-zinc-400 mt-1">Underwater / next-room warmth</p>
          </button>

          <button
            type="button"
            onClick={() => toggleEffect('vinyl')}
            className={`p-3 text-left border clip-chamfer-sm transition-all ${
              effects.vinyl
                ? 'bg-accent/20 border-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]'
                : 'bg-bg-elevated/60 border-border-subtle text-zinc-400 hover:text-white'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">Vinyl Crackle</p>
            <p className="text-[10px] text-zinc-400 mt-1">Analog record needle texture</p>
          </button>

          <button
            type="button"
            onClick={() => toggleEffect('dualVinyl')}
            className={`p-3 text-left border clip-chamfer-sm transition-all ${
              effects.dualVinyl
                ? 'bg-accent/20 border-accent text-white shadow-[0_0_12px_var(--color-accent-glow)]'
                : 'bg-bg-elevated/60 border-border-subtle text-zinc-400 hover:text-white'
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">Dual Vinyl</p>
            <p className="text-[10px] text-zinc-400 mt-1">Two-deck scratching emulation</p>
          </button>
        </div>
      )}
    </div>
  );
};
