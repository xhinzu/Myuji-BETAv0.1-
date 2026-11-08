import { Track, SyncedLyricLine, parseEnhancedLrc } from '@myujiku/shared';
import { useSettingsStore } from '../stores/settingsStore';

export interface AlignedResult {
  lines: SyncedLyricLine[];
  enhancedLrc: string;
  isAligned: boolean;
  cached: boolean;
}

export class AlignerClient {
  private static instance: AlignerClient;

  public static getInstance(): AlignerClient {
    if (!AlignerClient.instance) {
      AlignerClient.instance = new AlignerClient();
    }
    return AlignerClient.instance;
  }

  private getEndpoint(): string {
    const { settings } = useSettingsStore.getState();
    if (settings.alignerMode === 'remote' && settings.alignerRemoteUrl) {
      return settings.alignerRemoteUrl.replace(/\/+$/, '');
    }
    return 'http://127.0.0.1:8765';
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const base = this.getEndpoint();
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(1500) });
      if (!res.ok) return false;
      const json = await res.json();
      return json.status === 'healthy';
    } catch {
      return false;
    }
  }

  public async deriveLyrics(plainText: string, duration: number): Promise<AlignedResult> {
    const base = this.getEndpoint();
    const res = await fetch(`${base}/v1/derive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plain_text: plainText,
        total_duration_seconds: duration,
      }),
    });

    if (!res.ok) {
      throw new Error(`Derive failed: ${res.statusText}`);
    }

    const data = await res.json();
    const parsed = parseEnhancedLrc(data.enhanced_lrc, { songDuration: duration });

    return {
      lines: parsed.lines,
      enhancedLrc: data.enhanced_lrc,
      isAligned: false,
      cached: false,
    };
  }

  public async alignTrack(
    track: Track,
    rawLyrics: string,
    options?: { model?: string; separateVocals?: boolean }
  ): Promise<AlignedResult> {
    const { settings } = useSettingsStore.getState();
    const endpoint = this.getEndpoint();

    // YouTube Privacy Constraint Enforcement:
    // "YouTube alignment: if enabled, runs on the local temp-cached audio ONLY on the user's machine, NEVER uploads YouTube audio to any remote service"
    if (track.source === 'youtube') {
      const isLocalhost =
        endpoint.includes('127.0.0.1') || endpoint.includes('localhost');
      if (!isLocalhost) {
        throw new Error(
          'Security Policy: YouTube audio cannot be uploaded to remote aligners. Switch to Local Sidecar mode.'
        );
      }
    }

    // Prepare audio blob / payload
    let audioBlob: Blob;
    if (track.audioUrl) {
      const audioRes = await fetch(track.audioUrl);
      audioBlob = await audioRes.blob();
    } else {
      // Synthetic fallback audio
      audioBlob = new Blob([new Uint8Array(1024)], { type: 'audio/wav' });
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'track.wav');
    formData.append('lyrics', rawLyrics);
    formData.append('model', options?.model || settings.selectedAlignerModel || 'base');
    formData.append('separate_vocals', String(options?.separateVocals ?? settings.separateVocalsForAlignment));
    formData.append('duration', String(track.duration || 180));

    const headers: Record<string, string> = {};
    if (settings.alignerApiKey) {
      headers['X-MyuJiku-Sidecar-Token'] = settings.alignerApiKey;
    }

    const res = await fetch(`${endpoint}/v1/align`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Alignment failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const parsed = parseEnhancedLrc(data.enhanced_lrc, { songDuration: track.duration });

    return {
      lines: parsed.lines,
      enhancedLrc: data.enhanced_lrc,
      isAligned: true,
      cached: Boolean(data.cached),
    };
  }
}

