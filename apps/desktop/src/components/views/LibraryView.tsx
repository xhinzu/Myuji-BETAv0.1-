import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  Upload,
  Heart,
  Music2,
  FolderPlus,
  Play,
  Plus,
  Search,
  FileText,
  Clock,
} from 'lucide-react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { Track, parseEnhancedLrc } from '@myujiku/shared';
import { usePlayerStore } from '../../stores/playerStore';

export interface DbTrackItem {
  id: string;
  source: string;
  source_id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration: number;
  path?: string | null;
  artwork_url?: string | null;
  has_lyrics: boolean;
  raw_lyrics?: string | null;
  added_at: number;
}

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const LibraryView: React.FC = () => {
  const { addToQueue, setCurrentTrack, setIsPlaying, setActiveLyrics } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<'all' | 'liked' | 'recent'>('all');
  const [tracks, setTracks] = useState<DbTrackItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [folderInput, setFolderInput] = useState('');

  // Load tracks from SQLite
  const loadLibrary = useCallback(async () => {
    if (!isTauri) return;
    try {
      const items = await invoke<DbTrackItem[]>('get_library_tracks');
      setTracks(items);

      const liked = await invoke<DbTrackItem[]>('get_liked_tracks');
      setLikedIds(new Set(liked.map((t) => t.id)));
    } catch (err) {
      console.warn('Failed to load library tracks from Tauri SQLite:', err);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Handle Scan Folder
  const handleScanFolder = async () => {
    if (!folderInput.trim()) return;
    setIsScanning(true);
    setScanStatus(`Scanning ${folderInput.trim()}...`);
    try {
      if (isTauri) {
        const count = await invoke<number>('scan_local_folder', {
          folderPath: folderInput.trim(),
        });
        setScanStatus(`Scan complete! Found and indexed ${count} track(s).`);
        await loadLibrary();
      } else {
        setScanStatus('Folder scanning requires the native desktop app.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanStatus(`Scan failed: ${msg}`);
    } finally {
      setIsScanning(false);
      setShowScanDialog(false);
    }
  };

  // Toggle Like status
  const handleToggleLike = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (isTauri) {
      try {
        const isLiked = await invoke<boolean>('toggle_like', { trackId });
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (isLiked) {
            next.add(trackId);
          } else {
            next.delete(trackId);
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to toggle like:', err);
      }
    } else {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(trackId)) next.delete(trackId);
        else next.add(trackId);
        return next;
      });
    }
  };

  // Play a Track
  const handlePlayTrack = (track: DbTrackItem) => {
    const audioUrl = isTauri && track.path ? convertFileSrc(track.path) : '';
    const appTrack: Track = {
      id: track.id,
      source: 'local',
      sourceId: track.source_id,
      title: track.title,
      artist: track.artist,
      album: track.album || undefined,
      duration: track.duration,
      audioUrl: audioUrl,
      artworkUrl: track.artwork_url || undefined,
      capabilities: { rawAudio: true, canDownloadForAlignment: true },
    };

    setCurrentTrack(appTrack);
    setIsPlaying(true);

    if (track.raw_lyrics) {
      try {
        const parsed = parseEnhancedLrc(track.raw_lyrics);
        setActiveLyrics(parsed.lines);
      } catch (e) {
        console.warn('Failed to parse track lyrics:', e);
      }
    }

    if (isTauri) {
      invoke('add_play_history', { trackId: track.id }).catch(() => {});
    }
  };

  // Enqueue a Track
  const handleEnqueue = (e: React.MouseEvent, track: DbTrackItem) => {
    e.stopPropagation();
    const audioUrl = isTauri && track.path ? convertFileSrc(track.path) : '';
    const appTrack: Track = {
      id: track.id,
      source: 'local',
      sourceId: track.source_id,
      title: track.title,
      artist: track.artist,
      album: track.album || undefined,
      duration: track.duration,
      audioUrl: audioUrl,
      artworkUrl: track.artwork_url || undefined,
      capabilities: { rawAudio: true, canDownloadForAlignment: true },
    };
    addToQueue(appTrack);
  };

  // Handle Drag-and-Drop and File Upload parity
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Map files by base name to associate lyrics
    const audioFiles: File[] = [];
    const lyricsMap = new Map<string, string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'lrc' || ext === 'elrc') {
        const text = await file.text();
        const base = file.name.replace(/\.[^/.]+$/, '');
        lyricsMap.set(base, text);
      } else {
        audioFiles.push(file);
      }
    }

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const base = file.name.replace(/\.[^/.]+$/, '');
      const url = URL.createObjectURL(file);
      const rawLyrics = lyricsMap.get(base);

      const track: DbTrackItem = {
        id: `upload:${file.name}:${Date.now()}`,
        source: 'local',
        source_id: file.name,
        title: base,
        artist: 'Custom Upload',
        album: 'Direct Import',
        duration: 0,
        path: null,
        artwork_url: null,
        has_lyrics: Boolean(rawLyrics),
        raw_lyrics: rawLyrics,
        added_at: Date.now(),
      };

      setTracks((prev) => [track, ...prev]);

      if (i === 0) {
        handlePlayTrack(track);
      } else {
        const appTrack: Track = {
          id: track.id,
          source: 'local',
          sourceId: track.source_id,
          title: track.title,
          artist: track.artist,
          duration: 0,
          audioUrl: url,
          capabilities: { rawAudio: true, canDownloadForAlignment: true },
        };
        addToQueue(appTrack);
      }
    }
  };

  // Filter Tracks
  const filteredTracks = tracks.filter((t) => {
    if (activeTab === 'liked' && !likedIds.has(t.id)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full p-8 max-w-5xl mx-auto space-y-6 animate-fade-in overflow-y-auto">
      {/* Title & Actions */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Folder className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold tracking-wider uppercase text-white">Your Music Library</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-bg-surface border border-border-subtle text-zinc-400 font-mono">
            {tracks.length} tracks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanDialog(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface hover:bg-bg-elevated border border-border-subtle text-zinc-200 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-all"
          >
            <FolderPlus className="w-3.5 h-3.5 text-accent" />
            <span>Scan Folder</span>
          </button>

          <label className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold uppercase tracking-wider clip-chamfer-sm cursor-pointer shadow-[0_0_12px_var(--color-accent-glow)] transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Audio</span>
            <input
              type="file"
              accept="audio/*,.lrc,.elrc"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Scan Status Toast */}
      {scanStatus && (
        <div className="p-3 bg-accent/10 border border-accent/30 text-accent text-xs rounded flex items-center justify-between">
          <span>{scanStatus}</span>
          <button onClick={() => setScanStatus(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Scan Dialog Modal */}
      {showScanDialog && (
        <div className="p-4 bg-bg-surface border border-accent/40 clip-chamfer space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-accent" /> Scan Local Folder
          </h3>
          <p className="text-xs text-zinc-400">
            Enter the directory path to recursively index audio files (MP3, FLAC, WAV, OGG, M4A, OPUS) and sidecar LRC lyrics.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. C:\Users\Username\Music or F:\Vibecode\music"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              className="flex-1 bg-bg-base border border-border-base px-3 py-1.5 text-xs text-white rounded focus:outline-none focus:border-accent font-mono"
            />
            <button
              onClick={handleScanFolder}
              disabled={isScanning || !folderInput.trim()}
              className="px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider clip-chamfer-sm transition-all"
            >
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </button>
            <button
              onClick={() => setShowScanDialog(false)}
              className="px-3 py-1.5 bg-bg-elevated hover:bg-white/10 text-zinc-300 text-xs clip-chamfer-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs & Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              activeTab === 'all'
                ? 'bg-accent text-white shadow-[0_0_8px_var(--color-accent-glow)]'
                : 'bg-bg-surface text-zinc-400 hover:text-white'
            }`}
          >
            All Tracks ({tracks.length})
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              activeTab === 'liked'
                ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                : 'bg-bg-surface text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3 h-3 fill-current" />
            <span>Liked ({likedIds.size})</span>
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search title, artist, album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-bg-surface border border-border-subtle rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Track List */}
      {filteredTracks.length > 0 ? (
        <div className="space-y-1 border border-border-subtle rounded-lg bg-bg-surface/50 overflow-hidden divide-y divide-border-subtle">
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 bg-bg-surface">
            <span className="w-6 text-center">#</span>
            <span>Title</span>
            <span>Artist</span>
            <span className="flex items-center gap-1 justify-end pr-4">
              <Clock className="w-3 h-3" />
            </span>
            <span className="w-16 text-center">Actions</span>
          </div>

          {filteredTracks.map((track, idx) => {
            const isLiked = likedIds.has(track.id);
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2.5 items-center hover:bg-white/5 cursor-pointer group transition-colors text-xs"
              >
                {/* Index / Play Hover */}
                <div className="w-6 flex items-center justify-center text-zinc-500 group-hover:text-accent font-mono">
                  <Play className="w-3.5 h-3.5 hidden group-hover:block fill-current" />
                  <span className="group-hover:hidden">{idx + 1}</span>
                </div>

                {/* Title */}
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-semibold text-white truncate">{track.title}</span>
                  {track.has_lyrics && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-accent/20 border border-accent/40 text-accent font-mono flex-shrink-0">
                      <FileText className="w-2.5 h-2.5" />
                      LRC
                    </span>
                  )}
                </div>

                {/* Artist */}
                <div className="min-w-0 text-zinc-400 truncate">{track.artist}</div>

                {/* Duration */}
                <div className="text-zinc-500 text-right pr-4 font-mono text-[11px]">
                  {formatDuration(track.duration)}
                </div>

                {/* Actions */}
                <div className="w-16 flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => handleToggleLike(e, track.id)}
                    className="p-1 hover:text-rose-400 text-zinc-500 transition-colors"
                    title={isLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => handleEnqueue(e, track)}
                    className="p-1 hover:text-accent text-zinc-500 transition-colors"
                    title="Add to Queue"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="border-2 border-dashed border-border-base hover:border-accent clip-chamfer p-10 flex flex-col items-center justify-center text-center transition-colors bg-bg-surface/40">
          <Music2 className="w-10 h-10 text-zinc-400 mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">
            {tracks.length === 0 ? 'Your library is empty' : 'No matching tracks'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-4">
            {tracks.length === 0
              ? 'Scan a local music folder or drop MP3, FLAC, WAV, and LRC lyrics files to start listening.'
              : 'Try adjusting your search query or switching categories.'}
          </p>
          <label className="px-4 py-2 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs font-semibold text-zinc-200 cursor-pointer transition-colors">
            Browse Audio Files
            <input
              type="file"
              accept="audio/*,.lrc,.elrc"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};
