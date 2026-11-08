import { Track } from '@myujiku/shared';
import { TrackSourceProvider, SourceId } from './types';
import { YouTubeProvider } from './YouTubeProvider';
import { AudiusProvider } from './AudiusProvider';
import { JamendoProvider } from './JamendoProvider';
import { ArchiveProvider } from './ArchiveProvider';
import { useSettingsStore } from '../stores/settingsStore';

export class SourceManager {
  private static instance: SourceManager;
  private providers: Map<SourceId, TrackSourceProvider> = new Map();

  private constructor() {
    this.providers.set('youtube', new YouTubeProvider());
    this.providers.set('audius', new AudiusProvider());
    this.providers.set('jamendo', new JamendoProvider());
    this.providers.set('archive', new ArchiveProvider());
  }

  public static getInstance(): SourceManager {
    if (!SourceManager.instance) {
      SourceManager.instance = new SourceManager();
    }
    return SourceManager.instance;
  }

  public getProvider(id: SourceId): TrackSourceProvider | undefined {
    return this.providers.get(id);
  }

  public async searchSource(id: SourceId, query: string, limit = 15): Promise<Track[]> {
    const provider = this.providers.get(id);
    if (!provider) return [];
    return provider.search(query, limit);
  }

  public async unifiedSearch(query: string, limitPerSource = 8): Promise<Track[]> {
    const { settings } = useSettingsStore.getState();
    const enabledSources: SourceId[] = [];

    if (settings.youtubeConsentAccepted) {
      enabledSources.push('youtube');
    }
    enabledSources.push('audius');
    enabledSources.push('jamendo');

    if (settings.archiveProviderEnabled) {
      enabledSources.push('archive');
    }

    const promises = enabledSources.map(async (srcId) => {
      try {
        const prov = this.providers.get(srcId);
        if (!prov) return [];
        return await prov.search(query, limitPerSource);
      } catch (e) {
        console.warn(`Search failed for ${srcId}:`, e);
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat();
  }

  public async resolveAudio(track: Track): Promise<string> {
    if (track.source === 'local' && track.audioUrl) {
      return track.audioUrl;
    }

    const provider = this.providers.get(track.source as SourceId);
    if (!provider) {
      if (track.audioUrl) return track.audioUrl;
      throw new Error(`Unknown track source: ${track.source}`);
    }

    return provider.resolveAudio(track);
  }
}
