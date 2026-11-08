/**
 * Web Audio Engine for MyuJiku v2
 * Provides modular effects graph: Source -> Muffled (Low-pass) -> 8D Spatial Panner -> Vinyl Crackle -> Master Gain -> AnalyserNode -> Output
 */

export interface AudioEngineCallbacks {
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private ctx: AudioContext | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private muffledFilter: BiquadFilterNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private masterGain: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // 8D Audio LFO state
  private is8DEnabled = false;
  private eightDAnimFrame: number | null = null;
  private eightDPhase = 0;

  // Vinyl Crackle generator state
  private vinylGain: GainNode | null = null;
  private vinylBufferSource: AudioBufferSourceNode | null = null;

  private callbacks: AudioEngineCallbacks = {};
  private currentVolume = 0.8;
  private isMuted = false;

  private constructor() {
    // Singleton
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public setCallbacks(cbs: AudioEngineCallbacks): void {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  /**
   * Initializes AudioContext and builds the Web Audio graph
   */
  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.audioEl = new Audio();
      this.audioEl.crossOrigin = 'anonymous';
      this.audioEl.preload = 'auto';

      this.sourceNode = this.ctx.createMediaElementSource(this.audioEl);

      // 1. Muffled Biquad Filter (Low-pass)
      this.muffledFilter = this.ctx.createBiquadFilter();
      this.muffledFilter.type = 'lowpass';
      this.muffledFilter.frequency.setValueAtTime(22050, this.ctx.currentTime); // Transparent default
      this.muffledFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      // 2. 8D Stereo Panner
      this.pannerNode = this.ctx.createStereoPanner();
      this.pannerNode.pan.setValueAtTime(0, this.ctx.currentTime);

      // 3. Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.currentVolume, this.ctx.currentTime);

      // 4. Analyser Node for Visualizers & Music-Sync Edge Glow
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // 5. Vinyl Crackle Mixer Node
      this.vinylGain = this.ctx.createGain();
      this.vinylGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.vinylGain.connect(this.masterGain);

      // Connect Graph: Source -> Muffled -> Panner -> Master -> Analyser -> Destination
      this.sourceNode.connect(this.muffledFilter);
      this.muffledFilter.connect(this.pannerNode);
      this.pannerNode.connect(this.masterGain);
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);

      // Attach Audio Element Event Listeners
      this.audioEl.addEventListener('timeupdate', () => {
        if (this.audioEl && this.callbacks.onTimeUpdate) {
          this.callbacks.onTimeUpdate(this.audioEl.currentTime);
        }
      });

      this.audioEl.addEventListener('durationchange', () => {
        if (this.audioEl && this.callbacks.onDurationChange) {
          this.callbacks.onDurationChange(this.audioEl.duration || 0);
        }
      });

      this.audioEl.addEventListener('ended', () => {
        if (this.callbacks.onEnded) {
          this.callbacks.onEnded();
        }
      });

      this.audioEl.addEventListener('play', () => {
        if (this.callbacks.onPlayStateChange) {
          this.callbacks.onPlayStateChange(true);
        }
      });

      this.audioEl.addEventListener('pause', () => {
        if (this.callbacks.onPlayStateChange) {
          this.callbacks.onPlayStateChange(false);
        }
      });

      this.audioEl.addEventListener('error', () => {
        const err = this.audioEl?.error?.message || 'Playback stream error';
        if (this.callbacks.onError) {
          this.callbacks.onError(err);
        }
      });
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  /**
   * Loads an audio stream or file URL
   */
  public async load(url: string): Promise<void> {
    this.ensureContext();
    if (!this.audioEl) return;

    this.audioEl.src = url;
    this.audioEl.load();
  }

  public async play(): Promise<void> {
    this.ensureContext();
    if (this.audioEl) {
      await this.audioEl.play();
    }
  }

  public pause(): void {
    if (this.audioEl) {
      this.audioEl.pause();
    }
  }

  public seek(seconds: number): void {
    if (this.audioEl && !isNaN(seconds)) {
      this.audioEl.currentTime = Math.max(0, Math.min(this.audioEl.duration || 9999, seconds));
    }
  }

  public skipSeconds(delta: number): void {
    if (this.audioEl) {
      this.seek(this.audioEl.currentTime + delta);
    }
  }

  public setVolume(vol: number): void {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.03);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = muted ? 0 : this.currentVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.03);
    }
  }

  /**
   * Toggle 8D Spatial Audio effect
   */
  public set8D(enabled: boolean): void {
    this.is8DEnabled = enabled;
    if (!this.pannerNode || !this.ctx) return;

    if (enabled) {
      if (this.eightDAnimFrame) cancelAnimationFrame(this.eightDAnimFrame);

      const loop = () => {
        if (!this.is8DEnabled || !this.pannerNode || !this.ctx) return;
        // ~0.15 Hz rotation frequency
        this.eightDPhase += 0.012;
        const panVal = Math.sin(this.eightDPhase) * 0.85;
        this.pannerNode.pan.setValueAtTime(panVal, this.ctx.currentTime);
        this.eightDAnimFrame = requestAnimationFrame(loop);
      };
      this.eightDAnimFrame = requestAnimationFrame(loop);
    } else {
      if (this.eightDAnimFrame) cancelAnimationFrame(this.eightDAnimFrame);
      this.pannerNode.pan.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Toggle Muffled low-pass filter
   */
  public setMuffled(enabled: boolean): void {
    if (!this.muffledFilter || !this.ctx) return;
    const targetFreq = enabled ? 750 : 22050;
    this.muffledFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
  }

  /**
   * Toggle Vinyl crackle and needle surface noise synthesis
   */
  public setVinyl(enabled: boolean): void {
    this.ensureContext();
    if (!this.ctx || !this.vinylGain) return;

    if (enabled) {
      if (!this.vinylBufferSource) {
        // Generate 5-second procedural crackle loop buffer
        const bufferSize = this.ctx.sampleRate * 5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          // Subtle low-amplitude surface noise
          let sample = (Math.random() * 2 - 1) * 0.015;
          // Sparse random crackle / needle pop spikes
          if (Math.random() < 0.0008) {
            sample += (Math.random() * 2 - 1) * 0.35;
          }
          data[i] = sample;
        }

        this.vinylBufferSource = this.ctx.createBufferSource();
        this.vinylBufferSource.buffer = buffer;
        this.vinylBufferSource.loop = true;
        this.vinylBufferSource.connect(this.vinylGain);
        this.vinylBufferSource.start();
      }
      this.vinylGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.1);
    } else {
      if (this.vinylGain) {
        this.vinylGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
    }
  }

  /**
   * Retrieves live frequency data for edge glow & music-sync visualizers
   */
  public getByteFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    }
  }

  public getCurrentTime(): number {
    return this.audioEl?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioEl?.duration || 0;
  }
}
