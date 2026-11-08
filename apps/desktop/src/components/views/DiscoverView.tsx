import React, { useState } from 'react';
import { Compass, Search, ShieldAlert, Sparkles, Music } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useNavigationStore } from '../../stores/navigationStore';

export const DiscoverView: React.FC = () => {
  const { settings } = useSettingsStore();
  const { setOnboardingOpen } = useNavigationStore();

  const [activeSourceTab, setActiveSourceTab] = useState<'youtube' | 'audius' | 'jamendo' | 'archive'>(
    settings.youtubeConsentAccepted ? 'youtube' : 'audius'
  );
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full h-full p-8 max-w-5xl mx-auto space-y-6 animate-fade-in overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Compass className="w-6 h-6 text-accent" />
          <h1 className="text-xl font-bold tracking-wider uppercase text-white">Discover Music</h1>
        </div>

        {/* Source Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-bg-surface border border-border-subtle clip-chamfer-sm">
          <button
            type="button"
            onClick={() => setActiveSourceTab('youtube')}
            className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider clip-chamfer-sm transition-colors ${
              activeSourceTab === 'youtube'
                ? 'bg-rose-500 text-white'
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
                ? 'bg-purple-600 text-white'
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
                ? 'bg-amber-500 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Jamendo
          </button>
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
        </div>
      </div>

      {/* Unified Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeSourceTab.toUpperCase()} or enter artist/track name...`}
          className="w-full pl-12 pr-4 py-3 bg-bg-surface/80 border border-border-base clip-chamfer text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

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
            YouTube search uses the local <code>yt-dlp</code> tool to resolve audio streams directly on your device. Audio is never saved or exported and is kept only in an ephemeral OS temporary cache.
          </p>
          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold uppercase tracking-wider clip-chamfer shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
          >
            Review Terms & Turn On YouTube
          </button>
        </div>
      ) : (
        /* Source Catalog Content / Shelves */
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-accent mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Trending Shelves</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Chill Lofi Beats', 'Synthwave Night', 'Acoustic Morning', 'Deep Focus'].map((genre) => (
                <div
                  key={genre}
                  className="p-4 bg-bg-surface/80 border border-border-base clip-chamfer hover:border-accent transition-all cursor-pointer group"
                >
                  <div className="w-full aspect-video bg-bg-elevated border border-border-subtle clip-chamfer-sm flex items-center justify-center mb-3">
                    <Music className="w-6 h-6 text-zinc-400 group-hover:text-accent transition-colors" />
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{genre}</h4>
                  <p className="text-[10px] text-zinc-400 capitalize mt-0.5">{activeSourceTab} Catalog</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
