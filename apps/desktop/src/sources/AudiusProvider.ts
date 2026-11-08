import { Track, cleanTitleForLyrics, cleanArtistForLyrics } from '@myujiku/shared';
import { TrackSourceProvider, LicenseInfo } from './types';

interface AudiusTrackItem {
  id: string;
  title: string;
  user: {
    name: string;
    handle: string;
  };
  duration: number;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  permalink: string;
  genre?: string;
  mood?: string;
}

const AUDIUS_APP_NAME = 'MYUJIKU_DESKTOP_V2';
const AUDIUS_API_BASE = 'https://discoveryprovider.audius.co/v1';

export class AudiusProvider implements TrackSourceProvider {
  id = 'audius' as const;
  name = 'Audius';
  description = 'Decentralized indie catalog with artist-direct streaming';

  async search(query: string, limit = 15): Promise<Track[]> {
    const clean = query.trim();
    if (!clean) return [];

    try {
      const url = `${AUDIUS_API_BASE}/tracks/search?query=${encodeURIComponent(clean)}&app_name=${AUDIUS_APP_NAME}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Audius search failed: ${res.statusText}`);

      const json = await res.json();
      const items: AudiusTrackItem[] = json.data || [];

      return items.slice(0, limit).map((t) => this.mapToTrack(t));
    } catch (err) {
      console.warn('Audius search error:', err);
      return [];
    }
  }

  async getTrending(limit = 10): Promise<Track[]> {
    try {
      const url = `${AUDIUS_API_BASE}/tracks/trending?app_name=${AUDIUS_APP_NAME}&limit=${limit}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Audius trending failed: ${res.statusText}`);

      const json = await res.json();
      const items: AudiusTrackItem[] = json.data || [];

      return items.slice(0, limit).map((t) => this.mapToTrack(t));
    } catch (err) {
      console.warn('Audius trending error:', err);
      return [];
    }
  }

  async resolveAudio(track: Track): Promise<string> {
    return `${AUDIUS_API_BASE}/tracks/${track.sourceId}/stream?app_name=${AUDIUS_APP_NAME}`;
  }

  getLicenseInfo(track: Track): LicenseInfo {
    return {
      type: 'Audius Stream License',
      attributionText: `${track.artist} on Audius (Direct Artist Stream)`,
      url: `https://audius.co`,
      isCommercialAllowed: false,
    };
  }

  private mapToTrack(item: AudiusTrackItem): Track {
    const artwork =
      item.artwork?.['480x480'] || item.artwork?.['1000x1000'] || item.artwork?.['150x150'];

    return {
      id: `audius:${item.id}`,
      source: 'audius',
      sourceId: item.id,
      title: cleanTitleForLyrics(item.title),
      artist: cleanArtistForLyrics(item.user.name),
      duration: item.duration,
      artworkUrl: artwork,
      audioUrl: `${AUDIUS_API_BASE}/tracks/${item.id}/stream?app_name=${AUDIUS_APP_NAME}`,
      capabilities: { rawAudio: true, canDownloadForAlignment: true },
    };
  }
}
