/**
 * Ambient Soundscape Engine for MyuJiku v2
 * Manages 10 procedural audio loops bundled locally in the offline desktop application.
 */

export type AmbientTrackId =
  | 'rain'
  | 'thunder'
  | 'wind'
  | 'birds'
  | 'fireplace'
  | 'crickets'
  | 'waves'
  | 'chatter'
  | 'bass'
  | 'drums';

export interface AmbientTrackConfig {
  id: AmbientTrackId;
  name: string;
  file: string;
}

export const AMBIENT_MANIFEST: AmbientTrackConfig[] = [
  { id: 'rain', name: 'Rainfall', file: '/audio/rain.mp3' },
  { id: 'thunder', name: 'Thunder', file: '/audio/thunder.mp3' },
  { id: 'wind', name: 'Wind Gusts', file: '/audio/wind.mp3' },
  { id: 'birds', name: 'Morning Birds', file: '/audio/birds.mp3' },
  { id: 'fireplace', name: 'Fireplace', file: '/audio/fireplace.mp3' },
  { id: 'crickets', name: 'Night Crickets', file: '/audio/crickets.mp3' },
  { id: 'waves', name: 'Ocean Waves', file: '/audio/waves.mp3' },
  { id: 'chatter', name: 'Cafe Chatter', file: '/audio/chatter.mp3' },
  { id: 'bass', name: 'Sub Bass Drone', file: '/audio/bass.mp3' },
  { id: 'drums', name: 'Lo-Fi Drums', file: '/audio/drums.mp3' },
];

export class AmbientEngine {
  private static instance: AmbientEngine | null = null;

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private channelGains: Map<AmbientTrackId, GainNode> = new Map();
  private audioElements: Map<AmbientTrackId, HTMLAudioElement> = new Map();

  private constructor() {
    // Singleton
  }

  public static getInstance(): AmbientEngine {
    if (!AmbientEngine.instance) {
      AmbientEngine.instance = new AmbientEngine();
    }
    return AmbientEngine.instance;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  private getChannelGain(id: AmbientTrackId): GainNode {
    const ctx = this.ensureContext();
    let gain = this.channelGains.get(id);
    if (!gain) {
      gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      if (this.masterGain) {
        gain.connect(this.masterGain);
      }
      this.channelGains.set(id, gain);
    }
    return gain;
  }

  public setChannelVolume(id: AmbientTrackId, volume: number): void {
    const ctx = this.ensureContext();
    const gainNode = this.getChannelGain(id);
    const clamped = Math.max(0, Math.min(1, volume));

    gainNode.gain.setTargetAtTime(clamped, ctx.currentTime, 0.05);

    let audio = this.audioElements.get(id);
    if (clamped > 0) {
      if (!audio) {
        const item = AMBIENT_MANIFEST.find((m) => m.id === id);
        if (item) {
          audio = new Audio(item.file);
          audio.loop = true;
          audio.crossOrigin = 'anonymous';
          const source = ctx.createMediaElementSource(audio);
          source.connect(gainNode);
          this.audioElements.set(id, audio);
        }
      }
      if (audio && audio.paused) {
        audio.play().catch(() => {});
      }
    } else {
      if (audio && !audio.paused) {
        audio.pause();
      }
    }
  }

  public setMasterVolume(vol: number): void {
    const ctx = this.ensureContext();
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), ctx.currentTime, 0.05);
    }
  }

  public stopAll(): void {
    for (const [id] of this.channelGains) {
      this.setChannelVolume(id, 0);
    }
  }
}
