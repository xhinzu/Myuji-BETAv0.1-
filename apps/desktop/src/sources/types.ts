import { Track } from '@myujiku/shared';

export type SourceId = 'youtube' | 'audius' | 'jamendo' | 'archive' | 'local';

export interface LicenseInfo {
  type: string;
  url?: string;
  attributionText: string;
  isCommercialAllowed: boolean;
}

export interface TrackSourceProvider {
  id: SourceId;
  name: string;
  description: string;
  requiresConsent?: boolean;
  search(query: string, limit?: number): Promise<Track[]>;
  getTrending?(limit?: number): Promise<Track[]>;
  resolveAudio(track: Track): Promise<string>;
  getLicenseInfo?(track: Track): LicenseInfo;
}
