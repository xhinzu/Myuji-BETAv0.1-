import React, { useEffect } from 'react';
import { HelpCircle, X, Keyboard, Accessibility } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutEntry {
  key: string;
  description: string;
  category: 'Playback' | 'Lyrics Timing' | 'Navigation' | 'General';
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  // Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts: ShortcutEntry[] = [
    { key: 'Space', description: 'Play / Pause toggle', category: 'Playback' },
    { key: '← / →', description: 'Seek backward / forward 5 seconds', category: 'Playback' },
    { key: 'M', description: 'Toggle audio mute', category: 'Playback' },
    { key: 'S', description: 'Toggle shuffle mode', category: 'Playback' },
    { key: 'R', description: 'Cycle repeat mode (Off / All / One)', category: 'Playback' },
    { key: '[', description: 'Nudge lyric sync offset by -0.1s', category: 'Lyrics Timing' },
    { key: ']', description: 'Nudge lyric sync offset by +0.1s', category: 'Lyrics Timing' },
    { key: 'Ctrl + K', description: 'Open global Command Palette', category: 'Navigation' },
    { key: 'Ctrl + / or ?', description: 'Show keyboard shortcuts & help', category: 'Navigation' },
    { key: 'Ctrl + 1', description: 'Go to Lyrics Stage', category: 'Navigation' },
    { key: 'Ctrl + 2', description: 'Go to Library', category: 'Navigation' },
    { key: 'Ctrl + 3', description: 'Go to Discover', category: 'Navigation' },
    { key: 'Ctrl + 4', description: 'Go to Ambient Mixer', category: 'Navigation' },
    { key: 'Ctrl + 5', description: 'Go to Listen Together Rooms', category: 'Navigation' },
    { key: 'Ctrl + 6', description: 'Go to Settings', category: 'Navigation' },
    { key: 'Esc', description: 'Close modal / drawer / return to Stage', category: 'General' },
    { key: 'F', description: 'Toggle fullscreen window', category: 'General' },
  ];

  const categories: ShortcutEntry['category'][] = [
    'Playback',
    'Lyrics Timing',
    'Navigation',
    'General',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts & Accessibility"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
    >
      <div className="relative w-full max-w-2xl bg-bg-surface border border-border-base clip-chamfer shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-elevated/40">
          <div className="flex items-center gap-2.5 text-accent">
            <HelpCircle className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Keyboard Shortcuts & Accessibility Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Help Dialog"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Accessibility Banner */}
        <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
          <Accessibility className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Full keyboard navigation, WCAG AA compliant contrast (≥4.5:1), and screen-reader labels are enabled across all controls.</span>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          {categories.map((cat) => {
            const list = shortcuts.filter((s) => s.category === cat);
            return (
              <div key={cat} className="space-y-2">
                <h3 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-accent" />
                  <span>{cat}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {list.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between px-3 py-2 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm"
                    >
                      <span className="text-zinc-300">{item.description}</span>
                      <kbd className="px-2 py-0.5 bg-black/60 border border-border-subtle rounded font-mono font-bold text-accent text-[11px] shadow-sm">
                        {item.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle bg-bg-elevated/20 flex justify-between items-center text-xs text-zinc-400">
          <span>Press <kbd className="px-1.5 py-0.5 bg-black/50 border border-border-subtle rounded font-mono text-white text-[10px]">Esc</kbd> to dismiss</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white font-bold clip-chamfer-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
