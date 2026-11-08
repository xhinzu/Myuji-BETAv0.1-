import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Activity,
  Copy,
  Check,
  PlayCircle,
  Loader2,
  Wrench,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigationStore } from '../../stores/navigationStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettingsStore } from '../../stores/settingsStore';

interface TauriToolStatus {
  installed: boolean;
  yt_dlp_path?: string | null;
  yt_dlp_version?: string | null;
  channel: string;
  js_runtime?: string | null;
  js_runtime_path?: string | null;
  last_updated?: number | null;
  last_error?: string | null;
}

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const InspectModal: React.FC = () => {
  const { isInspectModalOpen, setInspectModalOpen } = useNavigationStore();
  const player = usePlayerStore();
  const { settings } = useSettingsStore();

  const [fps, setFps] = useState<number>(60);
  const [copied, setCopied] = useState<boolean>(false);
  const [toolStatus, setToolStatus] = useState<TauriToolStatus | null>(null);
  const [isTestingVideo, setIsTestingVideo] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  const fetchToolStatus = useCallback(async () => {
    if (!isTauri) return;
    try {
      const status = await invoke<TauriToolStatus>('get_ytdlp_status');
      setToolStatus(status);
    } catch (e) {
      console.warn('Failed to fetch tool status:', e);
    }
  }, []);

  // Live FPS measurement loop & Tool status
  useEffect(() => {
    if (!isInspectModalOpen) return;

    fetchToolStatus();

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
  }, [isInspectModalOpen, fetchToolStatus]);

  if (!isInspectModalOpen) return null;

  const handleTestVideo = async () => {
    setIsTestingVideo(true);
    setTestResult('Resolving test stream via yt-dlp & loopback proxy...');
    try {
      if (isTauri) {
        const res = await invoke<{ stream_url: string; title: string; duration: number }>(
          'resolve_youtube_stream',
          { videoId: 'dQw4w9WgXcQ' }
        );
        setTestResult(
          `Success! "${res.title}" (${Math.round(res.duration)}s) resolved via ${res.stream_url}`
        );
      } else {
        setTestResult('Video test requires the native desktop app runtime.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult(`Test failed: ${msg}`);
    } finally {
      setIsTestingVideo(false);
    }
  };

  const diagnosticsData = {
    app: {
      name: 'MyuJiku',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      fps,
    },
    tools: {
      installed: toolStatus?.installed ?? false,
      version: toolStatus?.yt_dlp_version ?? 'Unknown',
      channel: toolStatus?.channel ?? 'stable',
      jsRuntime: toolStatus?.js_runtime ?? 'None',
      jsRuntimePath: toolStatus?.js_runtime_path ?? 'None',
      lastError: toolStatus?.last_error ?? null,
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
                Real-time performance, yt-dlp resolver & engine telemetry
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestVideo}
              disabled={isTestingVideo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-zinc-300 hover:text-white transition-colors"
            >
              {isTestingVideo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>Test with a video</span>
            </button>

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

        {/* Video Test Result Banner */}
        {testResult && (
          <div className="p-2.5 bg-bg-elevated border border-accent/40 rounded text-xs font-mono text-zinc-200 flex items-center justify-between">
            <span className="truncate">{testResult}</span>
            <button
              onClick={() => setTestResult(null)}
              className="text-zinc-500 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tool Info Strip */}
        <div className="p-3 bg-bg-surface/80 border border-border-subtle clip-chamfer-sm flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300">
            <Wrench className="w-4 h-4 text-accent" />
            <span>yt-dlp: {toolStatus?.yt_dlp_version || 'Not Detected'}</span>
            <span className="text-zinc-600">|</span>
            <span>Channel: {toolStatus?.channel || 'stable'}</span>
            <span className="text-zinc-600">|</span>
            <span>JS: {toolStatus?.js_runtime || 'None'}</span>
          </div>
          <span className="text-zinc-500 text-[11px]">Cache: 500 MB (LRU)</span>
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
