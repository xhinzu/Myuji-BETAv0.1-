import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Folder,
  Compass,
  Sliders,
  Users,
  Settings,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Palette,
  Eye,
  FileText,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { useNavigationStore } from '../../stores/navigationStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { exportThemeJson } from '@myujiku/shared';

interface PaletteCommand {
  id: string;
  title: string;
  category: 'Navigation' | 'Playback' | 'Audio Effects' | 'Appearance' | 'System';
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTab,
    setInspectModalOpen,
    setCreditsModalOpen,
    setOnboardingOpen,
  } = useNavigationStore();

  const { isPlaying, togglePlay, skipNext, skipPrev, toggleEffect } = usePlayerStore();
  const { settings, updateTheme } = useSettingsStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Global Ctrl+K hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      } else if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const commands: PaletteCommand[] = [
    // Navigation
    {
      id: 'nav-stage',
      title: 'Navigate to Stage (Lyrics Visuals)',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4" />,
      action: () => { setActiveTab('stage'); setCommandPaletteOpen(false); },
    },
    {
      id: 'nav-library',
      title: 'Navigate to Library (Local & Saved)',
      category: 'Navigation',
      icon: <Folder className="w-4 h-4" />,
      action: () => { setActiveTab('library'); setCommandPaletteOpen(false); },
    },
    {
      id: 'nav-discover',
      title: 'Navigate to Discover (YouTube, Audius, Jamendo)',
      category: 'Navigation',
      icon: <Compass className="w-4 h-4" />,
      action: () => { setActiveTab('discover'); setCommandPaletteOpen(false); },
    },
    {
      id: 'nav-mixer',
      title: 'Navigate to Mixer (Ambient & Scratch)',
      category: 'Navigation',
      icon: <Sliders className="w-4 h-4" />,
      action: () => { setActiveTab('mixer'); setCommandPaletteOpen(false); },
    },
    {
      id: 'nav-rooms',
      title: 'Navigate to Rooms (Listen Together)',
      category: 'Navigation',
      icon: <Users className="w-4 h-4" />,
      action: () => { setActiveTab('rooms'); setCommandPaletteOpen(false); },
    },
    {
      id: 'nav-settings',
      title: 'Navigate to Settings',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4" />,
      action: () => { setActiveTab('settings'); setCommandPaletteOpen(false); },
    },

    // Playback
    {
      id: 'play-toggle',
      title: isPlaying ? 'Pause Playback' : 'Resume Playback',
      category: 'Playback',
      icon: isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />,
      action: () => { togglePlay(); setCommandPaletteOpen(false); },
    },
    {
      id: 'play-next',
      title: 'Skip to Next Song',
      category: 'Playback',
      icon: <SkipForward className="w-4 h-4" />,
      action: () => { skipNext(); setCommandPaletteOpen(false); },
    },
    {
      id: 'play-prev',
      title: 'Previous Song',
      category: 'Playback',
      icon: <SkipBack className="w-4 h-4" />,
      action: () => { skipPrev(); setCommandPaletteOpen(false); },
    },

    // Audio Effects
    {
      id: 'fx-8d',
      title: 'Toggle 8D Audio Effect',
      category: 'Audio Effects',
      icon: <Sliders className="w-4 h-4" />,
      action: () => { toggleEffect('eightD'); setCommandPaletteOpen(false); },
    },
    {
      id: 'fx-muffled',
      title: 'Toggle Muffled Low-Pass Filter',
      category: 'Audio Effects',
      icon: <Sliders className="w-4 h-4" />,
      action: () => { toggleEffect('muffled'); setCommandPaletteOpen(false); },
    },
    {
      id: 'fx-vinyl',
      title: 'Toggle Vinyl Crackle Texture',
      category: 'Audio Effects',
      icon: <Sliders className="w-4 h-4" />,
      action: () => { toggleEffect('vinyl'); setCommandPaletteOpen(false); },
    },

    // Appearance
    {
      id: 'theme-amoled',
      title: 'Set Theme: AMOLED Black',
      category: 'Appearance',
      icon: <Palette className="w-4 h-4" />,
      action: () => { updateTheme({ mode: 'amoled' }); setCommandPaletteOpen(false); },
    },
    {
      id: 'theme-dark',
      title: 'Set Theme: Dark',
      category: 'Appearance',
      icon: <Palette className="w-4 h-4" />,
      action: () => { updateTheme({ mode: 'dark' }); setCommandPaletteOpen(false); },
    },
    {
      id: 'theme-light',
      title: 'Set Theme: Light',
      category: 'Appearance',
      icon: <Palette className="w-4 h-4" />,
      action: () => { updateTheme({ mode: 'light' }); setCommandPaletteOpen(false); },
    },
    {
      id: 'theme-contrast',
      title: 'Toggle High Contrast (WCAG AAA)',
      category: 'Appearance',
      icon: <Eye className="w-4 h-4" />,
      action: () => { updateTheme({ highContrast: !settings.theme.highContrast }); setCommandPaletteOpen(false); },
    },
    {
      id: 'theme-export',
      title: 'Export Theme Settings (JSON)',
      category: 'Appearance',
      icon: <Download className="w-4 h-4" />,
      action: () => {
        const json = exportThemeJson(settings.theme);
        navigator.clipboard.writeText(json);
        alert('Theme JSON copied to clipboard!');
        setCommandPaletteOpen(false);
      },
    },

    // System
    {
      id: 'sys-inspect',
      title: 'Open Inspect Diagnostics Modal',
      category: 'System',
      icon: <Eye className="w-4 h-4" />,
      action: () => { setInspectModalOpen(true); setCommandPaletteOpen(false); },
    },
    {
      id: 'sys-consent',
      title: 'Review YouTube yt-dlp Consent & Terms',
      category: 'System',
      icon: <ShieldCheck className="w-4 h-4" />,
      action: () => { setOnboardingOpen(true); setCommandPaletteOpen(false); },
    },
    {
      id: 'sys-credits',
      title: 'View Open Source Credits & Licenses',
      category: 'System',
      icon: <FileText className="w-4 h-4" />,
      action: () => { setCreditsModalOpen(true); setCommandPaletteOpen(false); },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Command Palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-bg-surface/95 border border-border-base backdrop-blur-2xl clip-chamfer shadow-2xl overflow-hidden flex flex-col animate-slide-down"
      >
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle bg-bg-elevated/40">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search action..."
            className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.5 border border-border-subtle rounded">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-zinc-500 py-8 text-center">No matching commands found.</p>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between w-full p-2.5 text-left text-xs clip-chamfer-sm transition-colors ${
                    isSelected ? 'bg-accent text-white' : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isSelected ? 'text-white' : 'text-zinc-400'}>
                      {cmd.icon}
                    </span>
                    <span className="font-medium">{cmd.title}</span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-mono tracking-wider ${
                      isSelected ? 'text-white/80' : 'text-zinc-500'
                    }`}
                  >
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
