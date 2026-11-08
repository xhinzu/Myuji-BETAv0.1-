import { Track, cleanTitleForLyrics, cleanArtistForLyrics } from '@myujiku/shared';
import { TrackSourceProvider, LicenseInfo } from './types';

interface JamendoTrackItem {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name?: string;
  audio: string;
  audiodownload?: string;
  image: string;
  license_ccurl?: string;
  shareurl?: string;
}

const JAMENDO_CLIENT_ID = '56d30c08';
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

export class JamendoProvider implements TrackSourceProvider {
  id = 'jamendo' as const;
  name = 'Jamendo';
  description = 'Creative Commons music library for non-commercial listening';

  async search(query: string, limit = 15): Promise<Track[]> {
    const clean = query.trim();
    if (!clean) return [];

    try {
      const url = `${JAMENDO_API_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=${limit}&namesearch=${encodeURIComponent(clean)}&include=musicinfo&audioformat=mp32`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Jamendo search failed: ${res.statusText}`);

      const json = await res.json();
      const results: JamendoTrackItem[] = json.results || [];

      return results.map((t) => this.mapToTrack(t));
    } catch (err) {
      console.warn('Jamendo search error:', err);
      return [];
    }
  }

  async getTrending(limit = 10): Promise<Track[]> {
    try {
      const url = `${JAMENDO_API_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonpretty&limit=${limit}&boost=popularity_month&include=musicinfo&audioformat=mp32`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Jamendo trending failed: ${res.statusText}`);

      const json = await res.json();
      const results: JamendoTrackItem[] = json.results || [];

      return results.map((t) => this.mapToTrack(t));
    } catch (err) {
      console.warn('Jamendo trending error:', err);
      return [];
    }
  }

  async resolveAudio(track: Track): Promise<string> {
    if (track.audioUrl) return track.audioUrl;
    return `https://prod-1.storage.jamendo.com/?trackid=${track.sourceId}&format=mp32&from=app-${JAMENDO_CLIENT_ID}`;
  }

  getLicenseInfo(track: Track): LicenseInfo {
    return {
      type: 'Creative Commons',
      url: 'https://creativecommons.org/licenses/',
      attributionText: `${track.title} by ${track.artist} (Licensed under Creative Commons via Jamendo). Non-commercial listening.`,
      isCommercialAllowed: false,
    };
  }

  private mapToTrack(item: JamendoTrackItem): Track {
    return {
      id: `jamendo:${item.id}`,
      source: 'jamendo',
      sourceId: item.id,
      title: cleanTitleForLyrics(item.name),
      artist: cleanArtistForLyrics(item.artist_name),
      album: item.album_name,
      duration: item.duration,
      artworkUrl: item.image,
      audioUrl: item.audio,
      capabilities: { rawAudio: true, canDownloadForAlignment: true },
    };
  }
}
