/**
 * Core type definitions for MyuJiku v2 (@myujiku/shared)
 */

// --- 1. Lyrics & Alignment Types ---

export interface LyricSyllable {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface LyricWord {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
  confidence?: number; // 0.0 to 1.0 (from aligner)
  syllables?: LyricSyllable[];
}

export interface SyncedLyricLine {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  words: LyricWord[];
  confidence?: number; // 0.0 to 1.0 (from aligner)
  isFallback?: boolean; // true if line fell back to character-weighted derivation
}

export type LyricSyncType = 'word' | 'line' | 'none';

export interface LrcMetadata {
  title?: string;
  artist?: string;
  album?: string;
  lengthSeconds?: number;
  offsetMs?: number;
  by?: string;
  id?: string;
  recreatedWith?: string;
}

export interface ParseEnhancedLrcResult {
  meta: LrcMetadata;
  lines: SyncedLyricLine[];
  synced: LyricSyncType;
  format: 'enhanced' | 'lrc' | 'plain';
  error?: string;
  rawText: string;
}

export interface LyricTransform {
  speed: number;  // 0.5 to 2.0, default 1.0
  offset: number; // seconds, default 0.0
}

export type LyricsStyle =
  | 'classic'
  | 'visual'
  | 'constellation'
  | 'ship'
  | 'camera'
  | 'fisheye'
  | 'inverted_fisheye'
  | 'codestyle'
  | 'branches'
  | 'web';

export type LyricsFont =
  | 'inter'
  | 'nunito'
  | 'newsreader'
  | 'arimo'
  | 'nunito_sans'
  | 'jost'
  | 'playfair'
  | 'fira_code'
  | 'cinzel';

export type EdgeGlowMode = 'music_sync' | 'static';

export type EdgeGlowStyle =
  | 'ring'
  | 'corners'
  | 'bars'
  | 'vignette'
  | 'spotlight'
  | 'aurora'
  | 'neon_tube'
  | 'conic'
  | 'ripple'
  | 'breathing';

// --- 2. Music Source & Playback Types ---

export type MusicSourceType = 'youtube' | 'local' | 'audius' | 'jamendo' | 'archive';

export interface TrackCapabilities {
  rawAudio: boolean;
  canDownloadForAlignment: boolean;
}

export interface Track {
  id: string; // prefixed with source, e.g. "yt:dQw4w9WgXcQ" or "local:C:/Music/song.mp3"
  source: MusicSourceType;
  sourceId: string; // raw ID within source
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  artworkUrl?: string;
  audioUrl?: string; // stream or local file path/loopback URL
  license?: string;
  attributionUrl?: string;
  capabilities: TrackCapabilities;
  addedAt?: number;
}

export interface TrackSource {
  type: MusicSourceType;
  name: string;
  search(query: string, limit?: number): Promise<Track[]>;
  getTrack(sourceId: string): Promise<Track | null>;
  resolveAudio(track: Track): Promise<string>;
  getArtwork?(track: Track): Promise<string | undefined>;
}

// --- 3. Visuals & Lexicon Types ---

export type VisualCategory =
  | 'nature'
  | 'weather'
  | 'emotions'
  | 'body'
  | 'objects'
  | 'vehicles'
  | 'places'
  | 'animals'
  | 'food-drink'
  | 'music'
  | 'money-luxury'
  | 'time-space'
  | 'fantasy-dark'
  | 'party-night'
  | 'relationships'
  | 'actions'
  | 'colors'
  | 'slang';

export type VisualStyle = 'illustrated' | 'line' | 'emoji' | 'off';
export type ImageFrequency = 'low' | 'normal' | 'high';
export type EffectFrequency = 'low' | 'normal' | 'high';
export type EffectStrength = 'subtle' | 'normal' | 'strong';

export interface VisualContextCues {
  requires?: string[];
  excludes?: string[];
}

export interface VisualConcept {
  id: string;
  words: string[];
  phrases?: string[];
  category: VisualCategory;
  imageId: string;
  effectId?: string;
  weight: number;
  intensity: 'normal' | 'intense';
  contextCues?: VisualContextCues;
}

export interface VisualCue {
  lineIndex: number;
  wordIndex: number;
  conceptId: string;
  imageId: string;
  effectId?: string;
  intensity: 'normal' | 'intense';
  wordText: string;
  weight: number;
  category: VisualCategory;
}

export interface VisualTimelineOptions {
  frequency?: ImageFrequency;
  trackId?: string;
  visualStyle?: VisualStyle;
  enabled?: boolean;
}

export interface AssetManifestItem {
  id: string;
  name: string;
  category: VisualCategory;
  license: 'MIT' | 'ISC' | 'CC0' | 'CC BY 3.0' | 'CC_BY_3_0';
  author: string;
  sourceUrl: string;
  attribution: string;
  illustratedSvg: string;
  lineSvg: string;
  fallbackEmoji: string;
}

export interface VisualCueTimeline {
  cues: VisualCue[];
  cueMap: Map<string, VisualCue>;
  getCue: (lineIndex: number, wordIndex: number) => VisualCue | null;
}

// --- 4. Word Effects Types ---

export interface WordEffectRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WordEffectPalette {
  primary: string;
  secondary: string;
  glow: string;
  isChroma?: boolean;
}

export interface EffectTriggerParams {
  wordRect: WordEffectRect;
  palette: WordEffectPalette;
  naturalColors?: boolean;
  intensity?: 'normal' | 'intense';
  strength?: EffectStrength;
  seed?: number;
  wordText?: string;
}

export interface WordEffectDefinition {
  id: string;
  name: string;
  category: 'impact' | 'fire' | 'water' | 'emotion' | 'motion' | 'intense';
  intensity: 'normal' | 'intense';
  flashWarning?: boolean;
  defaultDurationMs: number;
}

// --- 5. Theme & Design Token Types ---

export type ThemeMode = 'light' | 'dark' | 'amoled' | 'system';
export type CornerStyle = 'sharp' | 'chamfer' | 'soft';
export type DensityStyle = 'compact' | 'comfortable' | 'spacious';
export type MotionLevel = 'full' | 'reduced' | 'off';

export interface OklchColor {
  l: number; // 0.0 to 1.0 (lightness)
  c: number; // 0.0 to 0.4 (chroma)
  h: number; // 0 to 360 (hue)
}

export interface PalettePreset {
  id: string;
  name: string;
  accent: OklchColor;
  description: string;
}

export interface ThemeTokens {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  borderBase: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  lyricActive: string;
  lyricInactive: string;
  lyricHighlight: string;
  radiusChamfer: string;
  uiScale: number;
}

export interface ThemeSettings {
  mode: ThemeMode;
  accentHue: number;
  accentChroma: number;
  accentLightness: number;
  followCoverArt: boolean;
  highContrast: boolean;
  cornerStyle: CornerStyle;
  density: DensityStyle;
  uiScale: number; // 80 to 150 percentage
  uiFont: string;
  lyricFont: LyricsFont;
  glassSurfaces: boolean;
  blurLevel: number; // 0 to 24px
  motionLevel: MotionLevel;
  animationSpeed: number; // 0.5 to 1.5
  customCssVariables?: Record<string, string>;
}

export interface AppSettings {
  version: number;
  theme: ThemeSettings;
  youtubeConsentAccepted: boolean;
  youtubeConsentDate?: string;
  ytDlpAutoUpdate: boolean;
  ytDlpChannel: 'stable' | 'nightly';
  tempCacheCapMb: number;
  officialEmbedFallback: boolean;
  alignerMode: 'off' | 'local' | 'remote';
  alignerRemoteUrl?: string;
  alignerApiKey?: string;
  autoAlignNewSongs: boolean;
  selectedAlignerModel: 'tiny' | 'base' | 'small';
  separateVocalsForAlignment: boolean;
  discordPresenceEnabled: boolean;
  discordHideSongDetails: boolean;
  discordApplicationId: string;
  archiveProviderEnabled?: boolean;
  jamendoClientId?: string;
  lastVolume: number;
  isMuted: boolean;
}
