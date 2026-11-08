import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Search,
  ShieldAlert,
  Sparkles,
  Music,
  Play,
  Plus,
  Layers,
  Loader2,
} from 'lucide-react';
import { Track } from '@myujiku/shared';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigationStore } from '../../stores/navigationStore';
import { usePlayerStore } from '../../stores/playerStore';
import { SourceManager } from '../../sources/SourceManager';
import { SourceId } from '../../sources/types';

export const DiscoverView: React.FC = () => {
  const { settings } = useSettingsStore();
  const { setOnboardingOpen } = useNavigationStore();
  const { setCurrentTrack, setIsPlaying, addToQueue } = usePlayerStore();

  const [activeSourceTab, setActiveSourceTab] = useState<SourceId | 'unified'>(
    settings.youtubeConsentAccepted ? 'youtube' : 'audius'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);

  const sourceManager = SourceManager.getInstance();

  // Load trending shelf for active source
  const loadTrending = useCallback(async () => {
    if (activeSourceTab === 'unified') {
      try {
        const results = await sourceManager.unifiedSearch('chill lofi beats', 4);
        setTrendingTracks(results);
      } catch (e) {
        console.warn('Failed to load unified trending:', e);
      }
      return;
    }

    if (activeSourceTab === 'youtube' && !settings.youtubeConsentAccepted) {
      setTrendingTracks([]);
      return;
    }

    const provider = sourceManager.getProvider(activeSourceTab);
    if (provider?.getTrending) {
      try {
        const results = await provider.getTrending(12);
        setTrendingTracks(results);
      } catch (e) {
        console.warn(`Failed to load trending for ${activeSourceTab}:`, e);
      }
    } else {
      setTrendingTracks([]);
    }
  }, [activeSourceTab, settings.youtubeConsentAccepted, sourceManager]);

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

  // Execute Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (activeSourceTab === 'unified') {
        const results = await sourceManager.unifiedSearch(query, 6);
        setSearchResults(results);
      } else {
        const results = await sourceManager.searchSource(activeSourceTab, query, 20);
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Play a Track (resolving audio if needed)
  const handlePlayTrack = async (track: Track) => {
    setResolvingTrackId(track.id);
    try {
      let finalAudioUrl = track.audioUrl;
      if (!finalAudioUrl || track.source === 'youtube') {
        finalAudioUrl = await sourceManager.resolveAudio(track);
      }

      const playableTrack: Track = {
        ...track,
        audioUrl: finalAudioUrl,
      };

      setCurrentTrack(playableTrack);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play track:', err);
      alert(err instanceof Error ? err.message : 'Could not play audio.');
    } finally {
      setResolvingTrackId(null);
    }
  };

  const handleEnqueue = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    addToQueue(track);
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs) || secs <= 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'youtube':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
            YouTube
          </span>
        );
      case 'audius':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
            Audius
          </span>
        );
      case 'jamendo':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Jamendo CC
          </span>
        );
      case 'archive':
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Archive
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-700 text-zinc-300">
            {source}
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full p-8 max-w-5xl mx-auto space-y-6 animate-fade-in overflow-y-auto">
      {/* Header & Source Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Compass className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold tracking-wider uppercase text-white">Discover Music</h1>
        </div>

        {/* Source Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-bg-surface border border-border-subtle clip-chamfer-sm">
          <button
            type="button"
            onClick={() => setActiveSourceTab('unified')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeSourceTab === 'unified'
                ? 'bg-accent text-white shadow-[0_0_8px_var(--color-accent-glow)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>All Sources</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSourceTab('youtube')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeSourceTab === 'youtube'
                ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            YouTube
          </button>
          <button
            type="button"
            onClick={() => setActiveSourceTab('audius')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeSourceTab === 'audius'
                ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Audius
          </button>
          <button
            type="button"
            onClick={() => setActiveSourceTab('jamendo')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeSourceTab === 'jamendo'
                ? 'bg-amber-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Jamendo
          </button>
          {settings.archiveProviderEnabled && (
            <button
              type="button"
              onClick={() => setActiveSourceTab('archive')}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
                activeSourceTab === 'archive'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Unified Search Input */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeSourceTab.toUpperCase()} or enter artist, song, or keywords...`}
          className="w-full pl-12 pr-28 py-3 bg-bg-surface/80 border border-border-base clip-chamfer text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={isSearching || !searchQuery.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider clip-chamfer-sm transition-all"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
        </button>
      </form>

      {/* YouTube Consent Notice if YouTube Tab is selected and not consented */}
      {activeSourceTab === 'youtube' && !settings.youtubeConsentAccepted ? (
        <div className="p-8 bg-bg-surface/80 border border-amber-500/30 clip-chamfer backdrop-blur-md flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
          <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Turn on YouTube Search & Trending
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            YouTube playback runs exclusively on your device via the local <code>yt-dlp</code> resolver. Audio is never saved, downloaded or exported, and resides strictly in an ephemeral temp stream.
          </p>
          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold uppercase tracking-wider clip-chamfer shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
          >
            Review Terms & Enable YouTube
          </button>
        </div>
      ) : (
        /* Results or Trending Shelves */
        <div className="space-y-6">
          {/* Active Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center justify-between">
                <span>Search Results ({searchResults.length})</span>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-zinc-500 hover:text-zinc-300 text-[11px] normal-case"
                >
                  Clear Results
                </button>
              </h2>

              <div className="space-y-1 border border-border-subtle rounded-lg bg-bg-surface/50 overflow-hidden divide-y divide-border-subtle">
                {searchResults.map((track) => {
                  const isResolving = resolvingTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-3 px-4 py-2.5 items-center hover:bg-white/5 cursor-pointer group transition-colors text-xs"
                    >
                      {/* Play Icon / Loader */}
                      <div className="w-6 flex items-center justify-center text-zinc-500 group-hover:text-accent">
                        {isResolving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </div>

                      {/* Artwork */}
                      {track.artworkUrl ? (
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          className="w-9 h-9 rounded object-cover bg-bg-base border border-border-subtle"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-bg-base border border-border-subtle flex items-center justify-center text-zinc-600">
                          <Music className="w-4 h-4" />
                        </div>
                      )}

                      {/* Title & Artist */}
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">{track.title}</div>
                        <div className="text-[11px] text-zinc-400 truncate">{track.artist}</div>
                      </div>

                      {/* Source Badge */}
                      <div>{getSourceBadge(track.source)}</div>

                      {/* Duration */}
                      <div className="text-zinc-500 font-mono text-[11px] text-right">
                        {formatDuration(track.duration)}
                      </div>

                      {/* Add to Queue */}
                      <div className="flex items-center justify-center pl-2">
                        <button
                          onClick={(e) => handleEnqueue(e, track)}
                          className="p-1.5 hover:text-accent text-zinc-500 hover:bg-white/5 rounded transition-colors"
                          title="Add to Queue"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trending Shelf */}
          {trendingTracks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>
                  {activeSourceTab === 'unified'
                    ? 'Featured Across Sources'
                    : `Trending on ${activeSourceTab.toUpperCase()}`}
                </span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {trendingTracks.map((track) => {
                  const isResolving = resolvingTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track)}
                      className="p-3 bg-bg-surface/80 border border-border-base clip-chamfer hover:border-accent transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="relative aspect-square w-full rounded overflow-hidden bg-bg-elevated border border-border-subtle mb-2.5">
                        {track.artworkUrl ? (
                          <img
                            src={track.artworkUrl}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500">
                            <Music className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {isResolving ? (
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/50">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          )}
                        </div>
                        <div className="absolute top-2 right-2">{getSourceBadge(track.source)}</div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{track.title}</h4>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
