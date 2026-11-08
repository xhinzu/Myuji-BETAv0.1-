import { create } from 'zustand';
import { Track, SyncedLyricLine, LyricTransform } from '@myujiku/shared';
import { AudioEngine } from '../audio/AudioEngine';

export interface PlayerEffectsState {
  eightD: boolean;
  muffled: boolean;
  vinyl: boolean;
  dualVinyl: boolean;
}

interface PlayerStoreState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  history: Track[];
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  effects: PlayerEffectsState;

  // Lyrics state
  activeLyrics: SyncedLyricLine[];
  activeLineIndex: number;
  activeWordIndex: number;
  lyricTransform: LyricTransform;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleEffect: (effect: keyof PlayerEffectsState) => void;
  setLyricTransform: (transform: Partial<LyricTransform>) => void;
  setActiveLyrics: (lyrics: SyncedLyricLine[]) => void;
  setActiveIndices: (lineIdx: number, wordIdx: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
  seek: (seconds: number) => void;
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => {
  const engine = AudioEngine.getInstance();

  // Attach Audio Engine Callbacks to sync with React State
  engine.setCallbacks({
    onTimeUpdate: (currentTime) => {
      set({ currentTime });

      // Update active lyrics line and word based on live clock
      const { activeLyrics, lyricTransform } = get();
      if (activeLyrics.length > 0) {
        const lyricTime = lyricTransform.speed * currentTime + lyricTransform.offset;
        let lineIdx = -1;
        let wordIdx = -1;

        for (let i = 0; i < activeLyrics.length; i++) {
          const line = activeLyrics[i];
          if (lyricTime >= line.start && lyricTime <= line.end) {
            lineIdx = i;
            if (line.words) {
              for (let w = 0; w < line.words.length; w++) {
                const word = line.words[w];
                if (lyricTime >= word.start && lyricTime <= word.end) {
                  wordIdx = w;
                  break;
                }
              }
            }
            break;
          }
        }

        if (lineIdx !== get().activeLineIndex || wordIdx !== get().activeWordIndex) {
          set({ activeLineIndex: lineIdx, activeWordIndex: wordIdx });
        }
      }
    },
    onDurationChange: (duration) => set({ duration }),
    onEnded: () => {
      const { repeatMode, skipNext, seek } = get();
      if (repeatMode === 'one') {
        seek(0);
        engine.play();
      } else {
        skipNext();
      }
    },
    onPlayStateChange: (isPlaying) => set({ isPlaying }),
  });

  return {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    queue: [],
    history: [],
    repeatMode: 'off',
    isShuffle: false,
    effects: {
      eightD: false,
      muffled: false,
      vinyl: false,
      dualVinyl: false,
    },
    activeLyrics: [],
    activeLineIndex: -1,
    activeWordIndex: -1,
    lyricTransform: { speed: 1.0, offset: 0.0 },

    setCurrentTrack: (track) => {
      set({ currentTrack: track, currentTime: 0, duration: track?.duration || 0 });
      if (track?.audioUrl) {
        engine.load(track.audioUrl).then(() => {
          engine.play();
        });
      }
    },

    setIsPlaying: (playing) => {
      set({ isPlaying: playing });
      if (playing) {
        engine.play();
      } else {
        engine.pause();
      }
    },

    togglePlay: () => {
      const next = !get().isPlaying;
      set({ isPlaying: next });
      if (next) {
        engine.play();
      } else {
        engine.pause();
      }
    },

    setCurrentTime: (time) => set({ currentTime: time }),
    setDuration: (dur) => set({ duration: dur }),

    setVolume: (vol) => {
      const clamped = Math.max(0, Math.min(1, vol));
      set({ volume: clamped });
      engine.setVolume(clamped);
    },

    toggleMute: () => {
      const next = !get().isMuted;
      set({ isMuted: next });
      engine.setMuted(next);
    },

    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
    removeFromQueue: (index) =>
      set((state) => ({ queue: state.queue.filter((_, i) => i !== index) })),
    clearQueue: () => set({ queue: [] }),

    toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
    cycleRepeat: () =>
      set((state) => {
        const next = state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off';
        return { repeatMode: next };
      }),

    toggleEffect: (effect) => {
      const current = get().effects[effect];
      const next = !current;
      set((state) => ({
        effects: { ...state.effects, [effect]: next },
      }));

      if (effect === 'eightD') engine.set8D(next);
      if (effect === 'muffled') engine.setMuffled(next);
      if (effect === 'vinyl') engine.setVinyl(next);
    },

    setLyricTransform: (transform) =>
      set((state) => ({
        lyricTransform: { ...state.lyricTransform, ...transform },
      })),

    setActiveLyrics: (lyrics) => set({ activeLyrics: lyrics }),
    setActiveIndices: (lineIdx, wordIdx) =>
      set({ activeLineIndex: lineIdx, activeWordIndex: wordIdx }),

    skipNext: () => {
      const { queue, currentTrack, history } = get();
      if (queue.length === 0) return;
      const nextTrack = queue[0];
      const nextQueue = queue.slice(1);
      const nextHistory = currentTrack ? [currentTrack, ...history] : history;

      set({
        currentTrack: nextTrack,
        queue: nextQueue,
        history: nextHistory,
        currentTime: 0,
        duration: nextTrack.duration || 0,
      });

      if (nextTrack.audioUrl) {
        engine.load(nextTrack.audioUrl).then(() => engine.play());
      }
    },

    skipPrev: () => {
      const { history, currentTrack, queue, currentTime } = get();
      if (currentTime > 3) {
        engine.seek(0);
        return;
      }
      if (history.length === 0) return;
      const prevTrack = history[0];
      const nextHistory = history.slice(1);
      const nextQueue = currentTrack ? [currentTrack, ...queue] : queue;

      set({
        currentTrack: prevTrack,
        history: nextHistory,
        queue: nextQueue,
        currentTime: 0,
        duration: prevTrack.duration || 0,
      });

      if (prevTrack.audioUrl) {
        engine.load(prevTrack.audioUrl).then(() => engine.play());
      }
    },

    seek: (seconds) => {
      const { duration } = get();
      const clamped = Math.max(0, Math.min(duration || 9999, seconds));
      set({ currentTime: clamped });
      engine.seek(clamped);
    },
  };
});
