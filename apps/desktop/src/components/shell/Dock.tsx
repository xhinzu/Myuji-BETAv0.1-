import React, { useRef, useState } from 'react';
import {
  Sparkles,
  Folder,
  Compass,
  Sliders,
  Users,
  Settings,
  Command,
} from 'lucide-react';
import { useNavigationStore, NavTab } from '../../stores/navigationStore';

export const Dock: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isDockExpanded,
    setDockExpanded,
    setCommandPaletteOpen,
    setInspectModalOpen,
  } = useNavigationStore();

  const logoTapCountRef = useRef<number>(0);
  const logoTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLogoCentered, setIsLogoCentered] = useState(false);

  // 7-tap detection on logo
  const handleLogoClick = () => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) clearTimeout(logoTapTimerRef.current);

    if (logoTapCountRef.current >= 7) {
      logoTapCountRef.current = 0;
      setInspectModalOpen(true);
    } else {
      logoTapTimerRef.current = setTimeout(() => {
        logoTapCountRef.current = 0;
      }, 1500);
    }
  };

  // Press-and-hold logo to enlarge to center
  const handleLogoMouseDown = () => {
    logoPressTimerRef.current = setTimeout(() => {
      setIsLogoCentered(true);
    }, 800);
  };

  const handleLogoMouseUp = () => {
    if (logoPressTimerRef.current) clearTimeout(logoPressTimerRef.current);
    if (isLogoCentered) {
      setIsLogoCentered(false);
    }
  };

  const navItems: { tab: NavTab; label: string; icon: React.ReactNode }[] = [
    { tab: 'stage', label: 'Stage', icon: <Sparkles className="w-5 h-5" /> },
    { tab: 'library', label: 'Library', icon: <Folder className="w-5 h-5" /> },
    { tab: 'discover', label: 'Discover', icon: <Compass className="w-5 h-5" /> },
    { tab: 'mixer', label: 'Mixer', icon: <Sliders className="w-5 h-5" /> },
    { tab: 'rooms', label: 'Rooms', icon: <Users className="w-5 h-5" /> },
    { tab: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Enlarged Logo Center Modal for inspection */}
      {isLogoCentered && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in cursor-pointer"
          onClick={() => setIsLogoCentered(false)}
        >
          <img
            src="/assets/logo.png"
            alt="MyuJiku Logo"
            className="w-72 h-72 object-contain drop-shadow-[0_0_35px_var(--color-accent)] animate-pulse"
          />
          <h1 className="mt-6 text-2xl font-bold tracking-widest uppercase text-white">
            MyuJiku v2
          </h1>
          <p className="text-sm text-zinc-400 mt-2">Click anywhere to return</p>
        </div>
      )}

      {/* Floating Vertical Dock */}
      <nav
        aria-label="Main Navigation Dock"
        onMouseEnter={() => setDockExpanded(true)}
        onMouseLeave={() => setDockExpanded(false)}
        className={`fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-out flex flex-col items-center py-4 px-2 bg-bg-surface/90 border border-border-base backdrop-blur-xl clip-chamfer shadow-2xl ${
          isDockExpanded ? 'w-44' : 'w-14'
        }`}
      >
        {/* Logo / Crest */}
        <button
          type="button"
          onClick={handleLogoClick}
          onMouseDown={handleLogoMouseDown}
          onMouseUp={handleLogoMouseUp}
          onTouchStart={handleLogoMouseDown}
          onTouchEnd={handleLogoMouseUp}
          title="MyuJiku Logo (7 taps opens Inspector)"
          className="mb-6 p-1 rounded transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <img
            src="/assets/logo.png"
            alt="MyuJiku Logo"
            className="w-8 h-8 object-contain drop-shadow-[0_0_8px_var(--color-accent-glow)] hover:scale-105 transition-transform"
          />
        </button>

        {/* Navigation Items */}
        <div className="flex flex-col gap-2 w-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                onClick={() => setActiveTab(item.tab)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 w-full p-2.5 transition-colors relative group focus:outline-none focus:ring-2 focus:ring-accent ${
                  isActive
                    ? 'text-white bg-accent/25 border-l-2 border-accent clip-chamfer-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 clip-chamfer-sm'
                }`}
              >
                <div className="shrink-0">{item.icon}</div>
                {isDockExpanded && (
                  <span className="text-xs font-semibold tracking-wider uppercase truncate">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-8 h-px bg-border-subtle my-4" />

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (Ctrl+K)"
          className="flex items-center gap-3 w-full p-2.5 text-zinc-400 hover:text-accent hover:bg-white/5 transition-colors clip-chamfer-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <Command className="w-5 h-5 shrink-0" />
          {isDockExpanded && (
            <span className="text-[11px] font-mono tracking-wider">Ctrl+K</span>
          )}
        </button>
      </nav>
    </>
  );
};
