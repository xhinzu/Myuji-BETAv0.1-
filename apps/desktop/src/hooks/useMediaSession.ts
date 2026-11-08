import { useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';

export function useMediaSession(): void {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    skipNext,
    skipPrev,
    seek,
  } = usePlayerStore();

  // 1. Update MediaMetadata when track changes
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'MyuJiku',
        artwork: currentTrack.artworkUrl
          ? [
              { src: currentTrack.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
              { src: currentTrack.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
              { src: currentTrack.artworkUrl, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [{ src: '/assets/logo.png', sizes: '256x256', type: 'image/png' }],
      });
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [currentTrack]);

  // 2. Update Playback State
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // 3. Update Position State for system media scrub bar
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (duration > 0 && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration,
          playbackRate: 1,
          position: Math.min(duration, Math.max(0, currentTime)),
        });
      } catch {
        // Ignored if timestamp briefly exceeds duration
      }
    }
  }, [currentTime, duration]);

  // 4. Attach Media Key Action Handlers
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => skipPrev());
    navigator.mediaSession.setActionHandler('nexttrack', () => skipNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      seek(currentTime - (details.seekOffset || 5));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      seek(currentTime + (details.seekOffset || 5));
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
  }, [togglePlay, skipNext, skipPrev, seek, currentTime]);
}
