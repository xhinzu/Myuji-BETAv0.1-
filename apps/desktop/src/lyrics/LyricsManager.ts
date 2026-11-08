import {
  Track,
  parseEnhancedLrc,
  ParseEnhancedLrcResult,
} from '@myujiku/shared';
import { open } from '@tauri-apps/plugin-shell';
import { LrclibProvider, LrclibItem } from './LrclibProvider';

export interface LyricsFetchResult {
  parsedResult: ParseEnhancedLrcResult;
  rawLyrics: string;
  isWordSynced: boolean;
  durationMismatch: boolean;
  durationDelta: number;
  lrclibId?: number;
}

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export class LyricsManager {
  private static instance: LyricsManager;
  private lrclib = new LrclibProvider();
  private cache: Map<string, LyricsFetchResult> = new Map();

  public static getInstance(): LyricsManager {
    if (!LyricsManager.instance) {
      LyricsManager.instance = new LyricsManager();
    }
    return LyricsManager.instance;
  }

  public async fetchLyricsForTrack(track: Track): Promise<LyricsFetchResult | null> {
    const cacheKey = `${track.source}:${track.sourceId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const item = await this.lrclib.getLyrics(track);
    if (!item) return null;

    const raw = item.syncedLyrics || item.plainLyrics || '';
    if (!raw.trim()) return null;

    const parsed = parseEnhancedLrc(raw, { songDuration: track.duration });
    const isWordSynced = parsed.synced === 'word' || parsed.format === 'enhanced';

    let durationMismatch = false;
    let durationDelta = 0;

    if (track.duration && track.duration > 0 && item.duration > 0) {
      durationDelta = Math.round(item.duration - track.duration);
      if (Math.abs(durationDelta) > 5) {
        durationMismatch = true;
      }
    }

    const result: LyricsFetchResult = {
      parsedResult: parsed,
      rawLyrics: raw,
      isWordSynced,
      durationMismatch,
      durationDelta,
      lrclibId: item.id,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  public setCustomLyrics(track: Track, rawContent: string): LyricsFetchResult {
    const cacheKey = `${track.source}:${track.sourceId}`;
    const parsed = parseEnhancedLrc(rawContent, { songDuration: track.duration });
    const isWordSynced = parsed.synced === 'word' || parsed.format === 'enhanced';

    const result: LyricsFetchResult = {
      parsedResult: parsed,
      rawLyrics: rawContent,
      isWordSynced,
      durationMismatch: false,
      durationDelta: 0,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  public async searchCandidates(query: string): Promise<LrclibItem[]> {
    return this.lrclib.searchCandidates(query);
  }

  public openLyricsifySearch(query: string): void {
    const url = `https://lyricsify.com/search?q=${encodeURIComponent(query)}`;
    if (isTauri) {
      open(url).catch(() => {
        window.open(url, '_blank');
      });
    } else {
      window.open(url, '_blank');
    }
  }
}

