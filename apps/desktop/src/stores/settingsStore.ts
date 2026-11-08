import { create } from 'zustand';
import {
  AppSettings,
  ThemeSettings,
  DEFAULT_THEME_SETTINGS,
  generateCssVariables,
  applyThemeToDom,
} from '@myujiku/shared';

const SETTINGS_STORAGE_KEY = 'myujiku_app_settings_v2';
const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: CURRENT_SCHEMA_VERSION,
  theme: DEFAULT_THEME_SETTINGS,
  youtubeConsentAccepted: false,
  youtubeConsentDate: undefined,
  ytDlpAutoUpdate: true,
  ytDlpChannel: 'stable',
  tempCacheCapMb: 500,
  officialEmbedFallback: true,
  alignerMode: 'off',
  alignerRemoteUrl: 'http://127.0.0.1:8765',
  alignerApiKey: '',
  autoAlignNewSongs: false,
  selectedAlignerModel: 'base',
  separateVocalsForAlignment: false,
  discordPresenceEnabled: false,
  discordHideSongDetails: false,
  discordApplicationId: '1567903090177343499',
  lastVolume: 0.8,
  isMuted: false,
};

function migrateSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_APP_SETTINGS;
  }

  const data = raw as Partial<AppSettings>;
  const version = data.version || 0;

  let current = { ...DEFAULT_APP_SETTINGS, ...data };

  // Example migration pathway if older schema is loaded
  if (version < 1) {
    current.version = 1;
    current.theme = { ...DEFAULT_THEME_SETTINGS, ...(data.theme || {}) };
  }

  return current;
}

function loadInitialSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_APP_SETTINGS;
  try {
    const serialized = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!serialized) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(serialized);
    return migrateSettings(parsed);
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

interface SettingsStoreState {
  settings: AppSettings;
  updateTheme: (updates: Partial<ThemeSettings>) => void;
  setYoutubeConsent: (accepted: boolean) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSection: (section: 'theme' | 'youtube' | 'aligner' | 'discord' | 'all') => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => {
  const initial = loadInitialSettings();

  // Apply initial theme CSS variables immediately
  if (typeof document !== 'undefined') {
    const cssVars = generateCssVariables(initial.theme);
    applyThemeToDom(cssVars);
  }

  const persist = (next: AppSettings) => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable or quota exceeded
    }
  };

  return {
    settings: initial,

    updateTheme: (updates: Partial<ThemeSettings>) => {
      const current = get().settings;
      const nextTheme = { ...current.theme, ...updates };
      const nextSettings: AppSettings = { ...current, theme: nextTheme };

      // Update DOM CSS variables instantly
      const cssVars = generateCssVariables(nextTheme);
      applyThemeToDom(cssVars);

      persist(nextSettings);
      set({ settings: nextSettings });
    },

    setYoutubeConsent: (accepted: boolean) => {
      const current = get().settings;
      const nextSettings: AppSettings = {
        ...current,
        youtubeConsentAccepted: accepted,
        youtubeConsentDate: accepted ? new Date().toISOString() : undefined,
      };
      persist(nextSettings);
      set({ settings: nextSettings });
    },

    updateSettings: (updates: Partial<AppSettings>) => {
      const current = get().settings;
      const nextSettings: AppSettings = { ...current, ...updates };

      if (updates.theme) {
        const cssVars = generateCssVariables(nextSettings.theme);
        applyThemeToDom(cssVars);
      }

      persist(nextSettings);
      set({ settings: nextSettings });
    },

    resetSection: (section) => {
      const current = get().settings;
      let next: AppSettings = { ...current };

      if (section === 'theme' || section === 'all') {
        next.theme = { ...DEFAULT_THEME_SETTINGS };
        const cssVars = generateCssVariables(next.theme);
        applyThemeToDom(cssVars);
      }
      if (section === 'youtube' || section === 'all') {
        next.youtubeConsentAccepted = false;
        next.youtubeConsentDate = undefined;
        next.ytDlpAutoUpdate = true;
        next.ytDlpChannel = 'stable';
        next.tempCacheCapMb = 500;
        next.officialEmbedFallback = true;
      }
      if (section === 'aligner' || section === 'all') {
        next.alignerMode = 'off';
        next.autoAlignNewSongs = false;
        next.selectedAlignerModel = 'base';
        next.separateVocalsForAlignment = false;
      }
      if (section === 'discord' || section === 'all') {
        next.discordPresenceEnabled = false;
        next.discordHideSongDetails = false;
      }

      persist(next);
      set({ settings: next });
    },
  };
});
