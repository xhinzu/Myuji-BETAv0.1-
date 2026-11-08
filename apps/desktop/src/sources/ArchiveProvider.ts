import { Track, cleanTitleForLyrics, cleanArtistForLyrics } from '@myujiku/shared';
import { TrackSourceProvider, LicenseInfo } from './types';

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string;
  description?: string;
  licenseurl?: string;
}

export class ArchiveProvider implements TrackSourceProvider {
  id = 'archive' as const;
  name = 'Internet Archive';
  description = 'Open-license historical audio, live recordings & public domain tracks';

  async search(query: string, limit = 15): Promise<Track[]> {
    const clean = query.trim();
    if (!clean) return [];

    try {
      const qStr = `mediatype:audio AND licenseurl:* AND (${encodeURIComponent(clean)})`;
      const url = `https://archive.org/advancedsearch.php?q=${qStr}&fl[]=identifier,title,creator,description,licenseurl&rows=${limit}&output=json`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Archive search failed: ${res.statusText}`);

      const json = await res.json();
      const docs: ArchiveDoc[] = json.response?.docs || [];

      return docs.map((doc) => this.mapToTrack(doc));
    } catch (err) {
      console.warn('Internet Archive search error:', err);
      return [];
    }
  }

  async resolveAudio(track: Track): Promise<string> {
    if (track.audioUrl) return track.audioUrl;
    // Archive items metadata
    try {
      const metaRes = await fetch(`https://archive.org/metadata/${track.sourceId}`);
      if (metaRes.ok) {
        const meta = await metaRes.json();
        const files: Array<{ name: string; format?: string }> = meta.files || [];
        const audioFile = files.find(
          (f) =>
            f.name.endsWith('.mp3') ||
            f.name.endsWith('.ogg') ||
            f.name.endsWith('.flac')
        );
        if (audioFile) {
          return `https://archive.org/download/${track.sourceId}/${encodeURIComponent(audioFile.name)}`;
        }
      }
    } catch (e) {
      console.warn('Failed to resolve archive stream:', e);
    }
    return '';
  }

  getLicenseInfo(track: Track): LicenseInfo {
    return {
      type: 'Open Access / Creative Commons',
      url: 'https://archive.org/about/',
      attributionText: `${track.title} via Internet Archive. Preserved under open-license terms.`,
      isCommercialAllowed: false,
    };
  }

  private mapToTrack(doc: ArchiveDoc): Track {
    const title = doc.title || doc.identifier;
    const artist = doc.creator || 'Archive Contributor';
    const artwork = `https://archive.org/services/img/${doc.identifier}`;

    return {
      id: `archive:${doc.identifier}`,
      source: 'archive',
      sourceId: doc.identifier,
      title: cleanTitleForLyrics(title),
      artist: cleanArtistForLyrics(artist),
      duration: 0, // Resolved dynamically or stream length
      artworkUrl: artwork,
      capabilities: { rawAudio: true, canDownloadForAlignment: true },
    };
  }
}
