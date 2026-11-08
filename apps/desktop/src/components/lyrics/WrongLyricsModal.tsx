import React, { useState } from 'react';
import {
  X,
  Search,
  Check,
  ExternalLink,
  Sparkles,
  FileText,
  Loader2,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/playerStore';
import { LyricsManager } from '../../lyrics/LyricsManager';
import { LrclibItem } from '../../lyrics/LrclibProvider';

interface WrongLyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WrongLyricsModal: React.FC<WrongLyricsModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack, setActiveLyrics } = usePlayerStore();
  const lyricsManager = LyricsManager.getInstance();

  const [searchQuery, setSearchQuery] = useState(
    currentTrack ? `${currentTrack.title} ${currentTrack.artist}` : ''
  );
  const [candidates, setCandidates] = useState<LrclibItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!isOpen || !currentTrack) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await lyricsManager.searchCandidates(searchQuery.trim());
      setCandidates(results);
    } catch (err) {
      console.error('Failed to search lyrics candidates:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCandidate = (item: LrclibItem) => {
    setSelectedId(item.id);
    const rawLyrics = item.syncedLyrics || item.plainLyrics || '';
    if (rawLyrics) {
      const result = lyricsManager.setCustomLyrics(currentTrack, rawLyrics);
      setActiveLyrics(result.parsedResult.lines);
    }
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleOpenLyricsify = () => {
    lyricsManager.openLyricsifySearch(searchQuery);
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs) || secs <= 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Wrong Lyrics Picker"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-bg-surface/95 border border-border-base backdrop-blur-2xl clip-chamfer shadow-2xl p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-accent" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Select Correct Lyrics
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                Matching against open LRCLIB database
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

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by song title, artist, or keywords..."
              className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-border-subtle clip-chamfer-sm text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider clip-chamfer-sm transition-all"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-96 pr-1">
          {candidates.length > 0 ? (
            candidates.map((item) => {
              const isSelected = selectedId === item.id;
              const hasSynced = Boolean(item.syncedLyrics);
              const durationDelta =
                currentTrack.duration > 0
                  ? Math.round(item.duration - currentTrack.duration)
                  : 0;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectCandidate(item)}
                  className={`p-3 bg-bg-elevated/40 hover:bg-bg-elevated border clip-chamfer-sm cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? 'border-accent bg-accent/10' : 'border-border-subtle'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-semibold text-xs text-white truncate">
                      {item.trackName}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {hasSynced ? (
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-mono">
                          Synced LRC
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.2 bg-zinc-700 text-zinc-300 rounded font-mono">
                          Plain Text
                        </span>
                      )}
                      {item.instrumental && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 text-purple-400 rounded font-mono">
                          Instrumental
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right font-mono text-[11px]">
                      <div className="text-zinc-300">{formatDuration(item.duration)}</div>
                      {durationDelta !== 0 && (
                        <div
                          className={`text-[10px] ${
                            Math.abs(durationDelta) > 5 ? 'text-amber-400' : 'text-zinc-500'
                          }`}
                        >
                          {durationDelta > 0 ? `+${durationDelta}s` : `${durationDelta}s`}
                        </div>
                      )}
                    </div>

                    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-bg-surface border border-border-subtle">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-accent" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-zinc-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              {isSearching
                ? 'Searching LRCLIB database...'
                : 'Click search above to query candidates for this song.'}
            </div>
          )}
        </div>

        {/* Browser helper footer */}
        <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-zinc-400">
          <span>Can't find it here?</span>
          <button
            type="button"
            onClick={handleOpenLyricsify}
            className="flex items-center gap-1.5 text-accent hover:underline text-xs font-semibold"
          >
            <span>Search on Lyricsify</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
