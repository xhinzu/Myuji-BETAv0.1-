import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Activity,
  Copy,
  Check,
} from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettingsStore } from '../../stores/settingsStore';

export const InspectModal: React.FC = () => {
  const { isInspectModalOpen, setInspectModalOpen } = useNavigationStore();
  const player = usePlayerStore();
  const { settings } = useSettingsStore();

  const [fps, setFps] = useState<number>(60);
  const [copied, setCopied] = useState<boolean>(false);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Live FPS measurement loop
  useEffect(() => {
    if (!isInspectModalOpen) return;

    let animId: number;
    const updateFps = (now: number) => {
      frameCountRef.current++;
      const delta = now - lastTimeRef.current;
      if (delta >= 500) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(updateFps);
    };

    animId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animId);
  }, [isInspectModalOpen]);

  if (!isInspectModalOpen) return null;

  const diagnosticsData = {
    app: {
      name: 'MyuJiku',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      fps,
    },
    player: {
      hasTrack: !!player.currentTrack,
      title: player.currentTrack?.title,
      artist: player.currentTrack?.artist,
      duration: player.duration,
      currentTime: player.currentTime,
      isPlaying: player.isPlaying,
      volume: player.volume,
      isMuted: player.isMuted,
      repeatMode: player.repeatMode,
      isShuffle: player.isShuffle,
      effects: player.effects,
    },
    lyrics: {
      lineCount: player.activeLyrics.length,
      activeLineIndex: player.activeLineIndex,
      activeWordIndex: player.activeWordIndex,
      speed: player.lyricTransform.speed,
      offset: player.lyricTransform.offset,
    },
    theme: settings.theme,
    youtube: {
      consentAccepted: settings.youtubeConsentAccepted,
      consentDate: settings.youtubeConsentDate,
      autoUpdate: settings.ytDlpAutoUpdate,
      channel: settings.ytDlpChannel,
      tempCacheCapMb: settings.tempCacheCapMb,
      officialEmbedFallback: settings.officialEmbedFallback,
    },
    aligner: {
      mode: settings.alignerMode,
      model: settings.selectedAlignerModel,
      separateVocals: settings.separateVocalsForAlignment,
    },
  };

  const handleCopyDiagnostics = () => {
    navigator.clipboard.writeText(JSON.stringify(diagnosticsData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={() => setInspectModalOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Inspect Diagnostics Modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-bg-surface/95 border border-border-base backdrop-blur-2xl clip-chamfer shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-accent animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                MyuJiku System & Diagnostics Inspector
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                Real-time performance and engine state
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyDiagnostics}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Diagnostics'}</span>
            </button>
            <button
              type="button"
              onClick={() => setInspectModalOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-4 gap-2.5">
          <div className="p-3 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-center">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Live Framerate</p>
            <p className="text-xl font-bold font-mono text-accent mt-0.5">{fps} FPS</p>
          </div>
          <div className="p-3 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-center">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Lyric Speed</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">
              {player.lyricTransform.speed.toFixed(2)}x
            </p>
          </div>
          <div className="p-3 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-center">
            <p className="text-[10px] uppercase font-mono text-zinc-500">Volume</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">
              {Math.round(player.volume * 100)}%
            </p>
          </div>
          <div className="p-3 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-center">
            <p className="text-[10px] uppercase font-mono text-zinc-500">YT Source</p>
            <p className={`text-sm font-bold font-mono mt-1 ${settings.youtubeConsentAccepted ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {settings.youtubeConsentAccepted ? 'ACTIVE' : 'OFF'}
            </p>
          </div>
        </div>

        {/* JSON / Diagnostics Details Viewer */}
        <div className="flex-1 overflow-y-auto bg-black/60 border border-border-subtle clip-chamfer-sm p-3 font-mono text-[11px] text-zinc-300">
          <pre className="whitespace-pre-wrap">{JSON.stringify(diagnosticsData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};
