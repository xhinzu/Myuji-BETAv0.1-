import { Track } from '@myujiku/shared';

export interface LrclibItem {
  id: number;
  name: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;
  instrumental: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

const LRCLIB_API_BASE = 'https://lrclib.net/api';

export class LrclibProvider {
  /**
   * Fetches lyrics by exact or approximate metadata match
   */
  async getLyrics(track: Track): Promise<LrclibItem | null> {
    const params = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist,
    });

    if (track.album) {
      params.append('album_name', track.album);
    }
    if (track.duration && track.duration > 0) {
      params.append('duration', Math.round(track.duration).toString());
    }

    try {
      const res = await fetch(`${LRCLIB_API_BASE}/get?${params.toString()}`, {
        headers: {
          'Lrclib-Client': 'MyuJiku-v2-Desktop (https://github.com/myujiku)',
        },
      });

      if (res.ok) {
        return (await res.json()) as LrclibItem;
      }
    } catch (err) {
      console.warn('LRCLIB exact get failed, trying search fallback:', err);
    }

    // Fallback to fuzzy search and duration ranking
    return this.searchBestMatch(track);
  }

  /**
   * Searches LRCLIB with keyword query and ranks results by duration proximity
   */
  async searchCandidates(query: string): Promise<LrclibItem[]> {
    const clean = query.trim();
    if (!clean) return [];

    try {
      const res = await fetch(`${LRCLIB_API_BASE}/search?q=${encodeURIComponent(clean)}`, {
        headers: {
          'Lrclib-Client': 'MyuJiku-v2-Desktop (https://github.com/myujiku)',
        },
      });

      if (!res.ok) return [];
      return (await res.json()) as LrclibItem[];
    } catch (err) {
      console.warn('LRCLIB search candidates error:', err);
      return [];
    }
  }

  private async searchBestMatch(track: Track): Promise<LrclibItem | null> {
    const query = `${track.title} ${track.artist}`;
    const candidates = await this.searchCandidates(query);

    if (candidates.length === 0) return null;

    // Filter to candidates with synced lyrics first
    const synced = candidates.filter((c) => Boolean(c.syncedLyrics));
    const list = synced.length > 0 ? synced : candidates;

    if (track.duration && track.duration > 0) {
      // Sort by absolute duration delta
      list.sort((a, b) => {
        const deltaA = Math.abs(a.duration - track.duration);
        const deltaB = Math.abs(b.duration - track.duration);
        return deltaA - deltaB;
      });
    }

    return list[0] || null;
  }
}
