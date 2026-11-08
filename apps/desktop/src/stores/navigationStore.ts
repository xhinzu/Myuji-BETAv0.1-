import { create } from 'zustand';

export type NavTab = 'stage' | 'library' | 'discover' | 'mixer' | 'rooms' | 'settings';

interface NavigationStoreState {
  activeTab: NavTab;
  isDockExpanded: boolean;
  isDeckOpen: boolean;
  isCommandPaletteOpen: boolean;
  isInspectModalOpen: boolean;
  isCreditsModalOpen: boolean;
  isOnboardingOpen: boolean;
  isMiniPlayer: boolean;
  isWrongLyricsModalOpen: boolean;
  isEditLyricsModalOpen: boolean;
  isMiniLyricsHudOpen: boolean;

  setActiveTab: (tab: NavTab) => void;
  toggleDockExpanded: () => void;
  setDockExpanded: (expanded: boolean) => void;
  toggleDeck: () => void;
  setDeckOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setInspectModalOpen: (open: boolean) => void;
  setCreditsModalOpen: (open: boolean) => void;
  setOnboardingOpen: (open: boolean) => void;
  setMiniPlayer: (mini: boolean) => void;
  setWrongLyricsModalOpen: (open: boolean) => void;
  setEditLyricsModalOpen: (open: boolean) => void;
  setMiniLyricsHudOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationStoreState>((set) => ({
  activeTab: 'stage',
  isDockExpanded: false,
  isDeckOpen: false,
  isCommandPaletteOpen: false,
  isInspectModalOpen: false,
  isCreditsModalOpen: false,
  isOnboardingOpen: false,
  isMiniPlayer: false,
  isWrongLyricsModalOpen: false,
  isEditLyricsModalOpen: false,
  isMiniLyricsHudOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleDockExpanded: () => set((state) => ({ isDockExpanded: !state.isDockExpanded })),
  setDockExpanded: (expanded) => set({ isDockExpanded: expanded }),
  toggleDeck: () => set((state) => ({ isDeckOpen: !state.isDeckOpen })),
  setDeckOpen: (open) => set({ isDeckOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setInspectModalOpen: (open) => set({ isInspectModalOpen: open }),
  setCreditsModalOpen: (open) => set({ isCreditsModalOpen: open }),
  setOnboardingOpen: (open) => set({ isOnboardingOpen: open }),
  setMiniPlayer: (mini) => set({ isMiniPlayer: mini }),
  setWrongLyricsModalOpen: (open) => set({ isWrongLyricsModalOpen: open }),
  setEditLyricsModalOpen: (open) => set({ isEditLyricsModalOpen: open }),
  setMiniLyricsHudOpen: (open) => set({ isMiniLyricsHudOpen: open }),
}));
