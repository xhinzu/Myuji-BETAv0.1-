import { Track, cleanTitleForLyrics, cleanArtistForLyrics } from '@myujiku/shared';
import { invoke } from '@tauri-apps/api/core';
import { TrackSourceProvider, LicenseInfo } from './types';
import { useSettingsStore } from '../stores/settingsStore';

interface TauriYouTubeTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail?: string | null;
}

interface TauriResolvedStream {
  stream_url: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail?: string | null;
  format_id: string;
}

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export class YouTubeProvider implements TrackSourceProvider {
  id = 'youtube' as const;
  name = 'YouTube';
  description = 'Mainstream catalog & new releases via local yt-dlp resolver';
  requiresConsent = true;

  private isConsentGranted(): boolean {
    return useSettingsStore.getState().settings.youtubeConsentAccepted;
  }

  async search(query: string, limit = 15): Promise<Track[]> {
    if (!this.isConsentGranted()) {
      return [];
    }

    if (!isTauri) {
      console.warn('YouTube provider requires Tauri desktop environment.');
      return [];
    }

    try {
      const results = await invoke<TauriYouTubeTrack[]>('search_youtube_tracks', {
        query,
        limit,
      });

      return results.map((item) => ({
        id: `youtube:${item.id}`,
        source: 'youtube',
        sourceId: item.id,
        title: cleanTitleForLyrics(item.title),
        artist: cleanArtistForLyrics(item.artist),
        duration: item.duration,
        artworkUrl: item.thumbnail || undefined,
        capabilities: { rawAudio: true, canDownloadForAlignment: false },
      }));
    } catch (err) {
      console.error('Failed to search YouTube:', err);
      return [];
    }
  }

  async getTrending(limit = 10): Promise<Track[]> {
    if (!this.isConsentGranted()) return [];
    if (!isTauri) return [];

    try {
      const data = await invoke<{ trending: TauriYouTubeTrack[]; lofi: TauriYouTubeTrack[] }>(
        'get_home_shelves'
      );
      const all = [...(data.trending || []), ...(data.lofi || [])].slice(0, limit);

      return all.map((item) => ({
        id: `youtube:${item.id}`,
        source: 'youtube',
        sourceId: item.id,
        title: cleanTitleForLyrics(item.title),
        artist: cleanArtistForLyrics(item.artist),
        duration: item.duration,
        artworkUrl: item.thumbnail || undefined,
        capabilities: { rawAudio: true, canDownloadForAlignment: false },
      }));
    } catch (err) {
      console.error('Failed to fetch YouTube trending:', err);
      return [];
    }
  }

  async resolveAudio(track: Track): Promise<string> {
    if (!this.isConsentGranted()) {
      throw new Error('YouTube playback requires consent. Please enable in Settings.');
    }

    if (!isTauri) {
      throw new Error('YouTube stream resolution requires Tauri desktop environment.');
    }

    const videoId = track.sourceId;
    const resolved = await invoke<TauriResolvedStream>('resolve_youtube_stream', {
      videoId,
    });

    return resolved.stream_url;
  }

  getLicenseInfo(track: Track): LicenseInfo {
    return {
      type: 'YouTube Standard License',
      attributionText: `${track.artist} (YouTube upload). Ephemeral local playback only.`,
      isCommercialAllowed: false,
    };
  }
}
