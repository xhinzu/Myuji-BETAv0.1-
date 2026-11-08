import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { RotateCw } from 'lucide-react';

import { ClassicStage } from '../stages/ClassicStage';
import { VisualStage } from '../stages/VisualStage';
import { ConstellationStage } from '../stages/ConstellationStage';
import { ShipStage } from '../stages/ShipStage';
import { CameraStage } from '../stages/CameraStage';
import { FisheyeStage } from '../stages/FisheyeStage';
import { InvertedFisheyeStage } from '../stages/InvertedFisheyeStage';
import { CodestyleStage } from '../stages/CodestyleStage';
import { BranchesStage } from '../stages/BranchesStage';
import { WebStage } from '../stages/WebStage';
import { EdgeGlowOverlay } from '../stages/EdgeGlowOverlay';
import { ParticleOverlay } from '../stages/ParticleOverlay';

export const Stage: React.FC<{ onUserActive?: () => void }> = ({ onUserActive }) => {
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

  const displayCenterIndex = isManualScroll ? manualScrollLineIndex : activeLineIndex;

  // Background style computation
  const backgroundMode = settings.theme.backgroundMode || 'blurred_cover';
  const coverUrl = currentTrack?.artworkUrl;

  const renderBackground = () => {
    switch (backgroundMode) {
      case 'amoled':
        return <div className="absolute inset-0 bg-black z-0 pointer-events-none" />;
      case 'cover':
        return coverUrl ? (
          <div
            className="absolute inset-0 bg-center bg-cover opacity-25 z-0 pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/90 z-0 pointer-events-none" />
        );
      case 'gradient':
        return (
          <div
            className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-all duration-700"
            style={{
              background: `radial-gradient(circle at 50% 50%, var(--color-accent) 0%, transparent 70%), linear-gradient(to bottom, #09090b, #000000)`,
            }}
          />
        );
      case 'blurred_cover':
      default:
        return (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {coverUrl ? (
              <div
                className="absolute -inset-10 bg-center bg-cover filter blur-3xl opacity-20 scale-110 transition-all duration-1000"
                style={{ backgroundImage: `url(${coverUrl})` }}
              />
            ) : (
              <div
                className="absolute -inset-10 filter blur-3xl opacity-15"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, var(--color-accent) 0%, transparent 60%)',
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
          </div>
        );
    }
  };

  // Render selected lyrics style component
  const renderLyricsStage = () => {
    const style = settings.theme.lyricStyle || 'classic';
    const props = {
      lyrics: activeLyrics,
      activeLineIndex: displayCenterIndex,
      activeWordIndex,
      onSeek: seek,
    };

    switch (style) {
      case 'visual':
        return <VisualStage {...props} />;
      case 'constellation':
        return <ConstellationStage {...props} />;
      case 'ship':
        return <ShipStage {...props} />;
      case 'camera':
        return <CameraStage {...props} />;
      case 'fisheye':
        return <FisheyeStage {...props} />;
      case 'inverted_fisheye':
        return <InvertedFisheyeStage {...props} />;
      case 'codestyle':
        return <CodestyleStage {...props} />;
      case 'branches':
        return <BranchesStage {...props} />;
      case 'web':
        return <WebStage {...props} />;
      case 'classic':
      default:
        return <ClassicStage {...props} />;
    }
  };

  // Camera motion and zoom styles
  const zoomScale = (settings.theme.cameraZoom || 100) / 100;
  const cameraMotion = settings.theme.cameraMotion || 'subtle';

  let motionClass = '';
  if (cameraMotion === 'subtle') {
    motionClass = 'transition-transform duration-700 ease-out';
  } else if (cameraMotion === 'cinematic') {
    motionClass = 'transition-transform duration-1000 ease-in-out animate-pulse';
  }

  const isChroma = settings.theme.chromaMode;

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${isChroma ? 'animate-[hue-rotate_15s_linear_infinite]' : ''}`}
      onMouseMove={onUserActive}
      onClick={onUserActive}
      onWheel={handleWheel}
    >
      {/* 1. Background Layer */}
      {renderBackground()}

      {/* 2. Particle Effect Overlay */}
      <ParticleOverlay effect={settings.theme.overlayEffect || 'none'} />

      {/* 3. Edge Glow Overlay */}
      <EdgeGlowOverlay
        style={settings.theme.edgeGlowStyle || 'off'}
        mode={settings.theme.edgeGlowMode || 'reactive'}
      />

      {/* 4. Manual Scroll 4-second Pause Floating Indicator */}
      {isManualScroll && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-bg-surface/90 border border-accent/40 clip-chamfer-sm backdrop-blur-md flex items-center gap-2 text-xs text-zinc-300 animate-fade-in shadow-lg">
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

      {/* 5. Main Content Area with Zoom & Camera Motion */}
      <div
        className={`relative z-10 w-full h-full flex flex-col items-center justify-center px-6 py-16 text-center ${motionClass}`}
        style={{ transform: `scale(${zoomScale})` }}
      >
        {currentTrack && activeLyrics.length > 0 ? (
          renderLyricsStage()
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
