import React, { useEffect, useState, useRef } from 'react';
import { useNavigationStore } from './stores/navigationStore';
import { usePlayerStore } from './stores/playerStore';
import { useSettingsStore } from './stores/settingsStore';
import { Stage } from './components/shell/Stage';
import { Dock } from './components/shell/Dock';
import { Capsule } from './components/shell/Capsule';
import { Deck } from './components/shell/Deck';
import { CommandPalette } from './components/palette/CommandPalette';
import { YouTubeConsentModal } from './components/onboarding/YouTubeConsentModal';
import { InspectModal } from './components/inspect/InspectModal';
import { CreditsModal } from './components/credits/CreditsModal';
import { WrongLyricsModal } from './components/lyrics/WrongLyricsModal';
import { EditLyricsModal } from './components/lyrics/EditLyricsModal';
import { MiniLyricsHud } from './components/lyrics/MiniLyricsHud';
import { LibraryView } from './components/views/LibraryView';
import { DiscoverView } from './components/views/DiscoverView';
import { MixerView } from './components/views/MixerView';
import { RoomsView } from './components/views/RoomsView';
import { SettingsView } from './components/views/SettingsView';
import { useMediaSession } from './hooks/useMediaSession';
import { LyricsManager } from './lyrics/LyricsManager';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  useMediaSession();
  const {
    activeTab,
    setActiveTab,
    isWrongLyricsModalOpen,
    setWrongLyricsModalOpen,
    isEditLyricsModalOpen,
    setEditLyricsModalOpen,
    isMiniLyricsHudOpen,
    setMiniLyricsHudOpen,
  } = useNavigationStore();
  const { currentTrack, isPlaying, togglePlay, activeLyrics, setActiveLyrics } = usePlayerStore();
  const { settings } = useSettingsStore();

  const [isChromeVisible, setIsChromeVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fetch lyrics from LRCLIB when track changes and no lyrics are loaded
  useEffect(() => {
    if (!currentTrack) return;
    if (activeLyrics.length > 0) return;

    LyricsManager.getInstance()
      .fetchLyricsForTrack(currentTrack)
      .then((res) => {
        if (res && res.parsedResult.lines.length > 0) {
          setActiveLyrics(res.parsedResult.lines);
        }
      })
      .catch((err) => console.warn('Auto-fetch lyrics error:', err));
  }, [currentTrack, activeLyrics.length, setActiveLyrics]);

  // Auto-hide floating chrome after 3.5s inactivity during playback
  const handleUserActivity = () => {
    setIsChromeVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (isPlaying && activeTab === 'stage') {
      hideTimerRef.current = setTimeout(() => {
        setIsChromeVisible(false);
      }, 3500);
    }
  };

  useEffect(() => {
    const onMouseMove = () => handleUserActivity();
    const onKeyDown = () => handleUserActivity();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, activeTab]);

  // Global spacebar hotkey for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-bg-base text-text-primary"
      style={{ zoom: `${settings.theme.uiScale}%` }}
    >
      {/* 1. Stage-First Canvas Hero (Always active beneath) */}
      <div className="absolute inset-0 z-0">
        <Stage onUserActive={handleUserActivity} />
      </div>

      {/* 2. Floating Dock (Navigation Pill) */}
      <div
        className={`transition-opacity duration-500 ease-out ${
          isChromeVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Dock />
      </div>

      {/* 3. Floating Capsule & Deck (Bottom Player) */}
      <div
        className={`transition-opacity duration-500 ease-out ${
          isChromeVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Capsule />
        <Deck />
      </div>

      {/* 4. Sliding Drawer / Sheet Views for Content Pages */}
      {activeTab !== 'stage' && (
        <div className="fixed inset-y-0 left-20 right-0 z-30 bg-bg-base/90 backdrop-blur-2xl border-l border-border-base shadow-2xl flex flex-col animate-slide-left">
          {/* Drawer Close / Back to Stage header button */}
          <div className="flex justify-end p-4 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('stage')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <span>Back to Stage</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'library' && <LibraryView />}
            {activeTab === 'discover' && <DiscoverView />}
            {activeTab === 'mixer' && <MixerView />}
            {activeTab === 'rooms' && <RoomsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </div>
      )}

      {/* 5. Modals and Overlays */}
      <CommandPalette />
      <YouTubeConsentModal />
      <InspectModal />
      <CreditsModal />
      <WrongLyricsModal
        isOpen={isWrongLyricsModalOpen}
        onClose={() => setWrongLyricsModalOpen(false)}
      />
      <EditLyricsModal
        isOpen={isEditLyricsModalOpen}
        onClose={() => setEditLyricsModalOpen(false)}
      />
      <MiniLyricsHud
        isOpen={isMiniLyricsHudOpen}
        onClose={() => setMiniLyricsHudOpen(false)}
      />
    </div>
  );
};

export default App;
