import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { useNavigationStore } from '../../stores/navigationStore';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const Capsule: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    skipNext,
    skipPrev,
    seek,
    volume,
    isMuted,
    setVolume,
    toggleMute,
  } = usePlayerStore();

  const { isDeckOpen, toggleDeck } = useNavigationStore();

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      aria-label="Floating Playback Capsule"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-bg-surface/90 border border-border-base backdrop-blur-xl clip-chamfer shadow-2xl transition-all duration-300 px-4 py-2.5 flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Track Thumbnail & Title */}
        <div className="flex items-center gap-3 min-w-0 max-w-[40%]">
          <div className="w-10 h-10 shrink-0 bg-bg-elevated border border-border-subtle clip-chamfer-sm overflow-hidden flex items-center justify-center">
            {currentTrack?.artworkUrl ? (
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="/assets/logo.png"
                alt="MyuJiku Logo"
                className="w-6 h-6 object-contain opacity-75"
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {currentTrack?.title || 'No track loaded'}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              {currentTrack?.artist || 'Ready to play'}
            </p>
          </div>
        </div>

        {/* Center Transport Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={skipPrev}
            title="Previous (or restart)"
            className="p-1.5 text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_12px_var(--color-accent-glow)] focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={skipNext}
            title="Next Track"
            className="p-1.5 text-zinc-400 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right Tools & Volume & Deck toggle */}
        <div className="flex items-center gap-2">
          {/* Volume button and slider */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-1 text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 accent-accent cursor-pointer bg-white/10 rounded"
              title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
          </div>

          {/* Deck Toggle Button */}
          <button
            type="button"
            onClick={toggleDeck}
            title={isDeckOpen ? 'Collapse Deck' : 'Expand Deck (Queue & Lyrics Tools)'}
            className={`p-1.5 rounded transition-transform ${
              isDeckOpen ? 'rotate-180 text-accent' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress rail */}
      <div className="flex items-center gap-2 w-full pt-1">
        <span className="text-[10px] text-zinc-400 font-mono w-8 text-right">
          {formatTime(currentTime)}
        </span>
        <div
          role="progressbar"
          aria-valuenow={currentTime}
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const fraction = Math.max(0, Math.min(1, clickX / rect.width));
            seek(fraction * (duration || 0));
          }}
          className="flex-1 h-1.5 bg-white/10 hover:h-2 transition-all rounded-full cursor-pointer relative overflow-hidden"
        >
          <div
            className="h-full bg-accent relative"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-zinc-400 font-mono w-8">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
