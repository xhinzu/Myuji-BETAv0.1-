import { create } from 'zustand';
import { Track } from '@myujiku/shared';
import { AudioEngine } from '../audio/AudioEngine';
import { usePlayerStore } from './playerStore';

export interface RoomMember {
  id: string;
  name: string;
  avatarUrl?: string;
  isHost: boolean;
  pingMs: number;
}

export interface RoomChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface RoomReaction {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface RoomSyncClock {
  track: Track | null;
  positionSecs: number;
  isPlaying: boolean;
  updatedAt: number;
}

interface RoomState {
  isInRoom: boolean;
  roomCode: string | null;
  isHost: boolean;
  members: RoomMember[];
  currentClock: RoomSyncClock | null;
  chatMessages: RoomChatMessage[];
  recentReactions: RoomReaction[];
  skipVotes: string[]; // Member IDs who voted to skip
  isDemocratic: boolean; // Vote to skip enabled

  // Actions
  createRoom: (hostName: string) => string;
  joinRoom: (code: string, memberName: string) => boolean;
  leaveRoom: () => void;
  broadcastClock: (track: Track | null, pos: number, playing: boolean) => void;
  syncLocalClock: (clock: RoomSyncClock) => void;
  sendChatMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
  voteToSkip: (memberId: string) => boolean;
  toggleDemocraticMode: () => void;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

let syncInterval: NodeJS.Timeout | null = null;
let currentUserId = `user-${Math.random().toString(36).substring(2, 8)}`;
let currentUserName = 'Guest';

export const useRoomStore = create<RoomState>((set, get) => ({
  isInRoom: false,
  roomCode: null,
  isHost: false,
  members: [],
  currentClock: null,
  chatMessages: [],
  recentReactions: [],
  skipVotes: [],
  isDemocratic: true,

  createRoom: (hostName: string) => {
    const code = generateRoomCode();
    currentUserId = `host-${Math.random().toString(36).substring(2, 8)}`;
    currentUserName = hostName || 'Host';

    const hostMember: RoomMember = {
      id: currentUserId,
      name: currentUserName,
      isHost: true,
      pingMs: 12,
    };

    set({
      isInRoom: true,
      roomCode: code,
      isHost: true,
      members: [hostMember],
      chatMessages: [
        {
          id: 'welcome',
          senderId: 'system',
          senderName: 'Room Bot',
          text: `Room ${code} created. Share this code with friends to listen together!`,
          timestamp: Date.now(),
        },
      ],
      recentReactions: [],
      skipVotes: [],
    });

    // Start Host broadcast loop
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
      const state = get();
      if (!state.isInRoom || !state.isHost) return;

      const player = usePlayerStore.getState();
      const currentTrack = player.currentTrack;
      const isPlaying = player.isPlaying;
      const pos = AudioEngine.getInstance().getCurrentTime();

      get().broadcastClock(currentTrack, pos, isPlaying);
    }, 1000);

    return code;
  },

  joinRoom: (code: string, memberName: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return false;

    currentUserId = `guest-${Math.random().toString(36).substring(2, 8)}`;
    currentUserName = memberName || 'Friend';

    const newMember: RoomMember = {
      id: currentUserId,
      name: currentUserName,
      isHost: false,
      pingMs: 25,
    };

    set({
      isInRoom: true,
      roomCode: cleanCode,
      isHost: false,
      members: [
        { id: 'host-1', name: 'Room Host', isHost: true, pingMs: 15 },
        newMember,
      ],
      chatMessages: [
        {
          id: 'joined',
          senderId: 'system',
          senderName: 'Room Bot',
          text: `${currentUserName} joined room ${cleanCode}. Syncing audio...`,
          timestamp: Date.now(),
        },
      ],
      recentReactions: [],
      skipVotes: [],
    });

    // Start Client drift-correction interval
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(() => {
      const state = get();
      if (!state.isInRoom || state.isHost || !state.currentClock) return;

      get().syncLocalClock(state.currentClock);
    }, 800);

    return true;
  },

  leaveRoom: () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
    set({
      isInRoom: false,
      roomCode: null,
      isHost: false,
      members: [],
      currentClock: null,
      chatMessages: [],
      recentReactions: [],
      skipVotes: [],
    });
  },

  broadcastClock: (track, pos, isPlaying) => {
    const clock: RoomSyncClock = {
      track,
      positionSecs: pos,
      isPlaying,
      updatedAt: Date.now(),
    };
    set({ currentClock: clock });
  },

  syncLocalClock: (clock: RoomSyncClock) => {
    if (!clock.track) return;

    const player = usePlayerStore.getState();
    const engine = AudioEngine.getInstance();

    // 1. If song changed in room, load the track locally via its own source
    if (!player.currentTrack || player.currentTrack.id !== clock.track.id) {
      player.setCurrentTrack(clock.track);
      player.setIsPlaying(true);
      return;
    }

    // 2. Compute projected playback position accounting for network delay
    const now = Date.now();
    const elapsedSinceUpdate = (now - clock.updatedAt) / 1000;
    const projectedPos = clock.isPlaying
      ? clock.positionSecs + elapsedSinceUpdate
      : clock.positionSecs;

    const localPos = engine.getCurrentTime();
    const drift = Math.abs(localPos - projectedPos);

    // CRITICAL Drift correction: Keep within 50ms (0.05s)
    if (drift > 0.05) {
      engine.seek(projectedPos);
    }

    // Play/Pause state alignment
    if (clock.isPlaying && !player.isPlaying) {
      player.setIsPlaying(true);
      engine.play();
    } else if (!clock.isPlaying && player.isPlaying) {
      player.setIsPlaying(false);
      engine.pause();
    }
  },

  sendChatMessage: (text: string) => {
    if (!text.trim()) return;
    const newMsg: RoomChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      text: text.trim(),
      timestamp: Date.now(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-50), newMsg],
    }));
  },

  sendReaction: (emoji: string) => {
    const reaction: RoomReaction = {
      id: `react-${Date.now()}-${Math.random()}`,
      emoji,
      senderName: currentUserName,
      timestamp: Date.now(),
    };

    set((state) => ({
      recentReactions: [...state.recentReactions.slice(-20), reaction],
    }));

    // Auto prune after 4s
    setTimeout(() => {
      set((state) => ({
        recentReactions: state.recentReactions.filter((r) => r.id !== reaction.id),
      }));
    }, 4000);
  },

  voteToSkip: (memberId: string) => {
    const state = get();
    const currentVotes = new Set(state.skipVotes);
    currentVotes.add(memberId);
    const votesArr = Array.from(currentVotes);

    const neededVotes = Math.ceil(state.members.length / 2);
    set({ skipVotes: votesArr });

    if (votesArr.length >= neededVotes) {
      // Majority achieved: trigger skip to next song
      usePlayerStore.getState().skipNext();
      set({ skipVotes: [] });
      get().sendChatMessage(`🗳️ Majority vote reached (${votesArr.length}/${state.members.length}). Skipping to next track!`);
      return true;
    }

    get().sendChatMessage(`🗳️ Vote to skip: ${votesArr.length}/${neededVotes} needed.`);
    return false;
  },

  toggleDemocraticMode: () => {
    set((state) => ({ isDemocratic: !state.isDemocratic }));
  },
}));
