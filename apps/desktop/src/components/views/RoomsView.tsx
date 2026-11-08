import React, { useState } from 'react';
import {
  Users,
  Radio,
  ShieldCheck,
  KeyRound,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Share2,
  LogOut,
  Send,
  Vote,
} from 'lucide-react';
import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';

export const RoomsView: React.FC = () => {
  const {
    isInRoom,
    roomCode,
    isHost,
    members,
    chatMessages,
    skipVotes,
    isDemocratic,
    createRoom,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    sendReaction,
    voteToSkip,
    toggleDemocraticMode,
  } = useRoomStore();

  const { currentTrack } = usePlayerStore();

  const [inputCode, setInputCode] = useState('');
  const [userName, setUserName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!roomCode) return;
    const link = `https://myujiku.app/room/${roomCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const emojis = ['🔥', '💖', '✨', '😭', '🎶', '🎉'];

  return (
    <div className="w-full h-full p-8 max-w-4xl mx-auto space-y-6 animate-fade-in overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white">
              Listen Together (Rooms) {isInRoom && `• ${roomCode}`}
            </h1>
            <p className="text-xs text-zinc-400">
              Synchronized word-level listening sessions with drift correction (&lt;50ms)
            </p>
          </div>
        </div>
      </div>

      {!isInRoom ? (
        /* 1. Create or Join State */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Join Existing Room */}
          <div className="p-6 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2.5 text-accent">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Join Existing Room</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Enter a 6-character room code to join an active session:
            </p>
            <div className="space-y-3">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your Nickname"
                className="w-full px-4 py-2 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-xs text-white focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                maxLength={7}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="e.g. MYU-892"
                className="w-full px-4 py-3 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-center text-lg font-mono font-bold tracking-widest text-white uppercase focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                disabled={!inputCode.trim()}
                onClick={() => joinRoom(inputCode, userName || 'Friend')}
                className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white text-xs font-semibold uppercase tracking-wider clip-chamfer-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_var(--color-accent-glow)]"
              >
                <span>Join Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Host a Room */}
          <div className="p-6 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-accent">
                <Radio className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Host a Room</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Create a shared listening session with authoritative host playback controls, synchronized lyric clock, and democratic skip voting.
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Host Name (e.g. Sreed)"
                className="w-full px-4 py-2 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-xs text-white focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={() => createRoom(userName)}
                className="w-full py-2.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle text-white text-xs font-semibold uppercase tracking-wider clip-chamfer-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4 text-accent" />
                <span>Create New Room</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 2. Active Room Dashboard */
        <div className="space-y-5">
          {/* Room Banner */}
          <div className="p-5 bg-accent/10 border border-accent/30 clip-chamfer flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-accent tracking-widest block mb-1">
                Connected to Session
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-white tracking-widest">
                  {roomCode}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ● CLOCK DRIFT &lt; 50ms
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-2 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300 font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-accent hover:bg-accent-hover text-white clip-chamfer-sm text-xs font-semibold"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </button>
              <button
                type="button"
                onClick={leaveRoom}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 clip-chamfer-sm text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* Members & Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connected Peers */}
            <div className="p-4 bg-bg-surface/80 border border-border-base clip-chamfer space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
                <span>Listening Together ({members.length} peers)</span>
                <span className="text-[10px] text-zinc-500">Auto-Reconciling</span>
              </div>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 bg-black/40 border border-border-subtle rounded text-xs text-white"
                  >
                    <span className="font-semibold flex items-center gap-2">
                      {m.name}
                      {m.isHost && (
                        <span className="text-[9px] bg-accent/30 text-accent px-1.5 py-0.5 rounded font-mono">
                          HOST
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">{m.pingMs}ms ping</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Democratic Skip Voting & Mode */}
            <div className="p-4 bg-bg-surface/80 border border-border-base clip-chamfer flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-2">
                  <span>Room Governance</span>
                  {isHost && (
                    <button
                      type="button"
                      onClick={toggleDemocraticMode}
                      className="text-[10px] text-accent hover:underline"
                    >
                      {isDemocratic ? 'Host-Only' : 'Democratic'}
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-300">
                  Current Mode:{' '}
                  <span className="text-white font-bold">
                    {isDemocratic ? 'Democratic (Majority Vote-to-Skip)' : 'Host-Controlled'}
                  </span>
                </p>
                {currentTrack && (
                  <div className="mt-3 p-2 bg-black/40 rounded text-xs text-zinc-300">
                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Synced Track</span>
                    <span className="font-semibold text-white truncate block">{currentTrack.title}</span>
                    <span className="text-[11px] text-zinc-400 truncate block">{currentTrack.artist}</span>
                  </div>
                )}
              </div>

              {isDemocratic && (
                <button
                  type="button"
                  onClick={() => voteToSkip(members[0]?.id || 'me')}
                  className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 clip-chamfer-sm text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Vote className="w-4 h-4" />
                  <span>Vote to Skip ({skipVotes.length}/{Math.ceil(members.length / 2)} votes)</span>
                </button>
              )}
            </div>
          </div>

          {/* Chat & Reaction Feed */}
          <div className="p-4 bg-bg-surface/80 border border-border-base clip-chamfer space-y-3">
            <div className="text-xs text-zinc-400 font-semibold">Live Room Chat & Reactions</div>
            <div className="h-36 overflow-y-auto space-y-1.5 font-mono text-xs pr-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-zinc-300">
                  <span className="text-accent font-semibold">{msg.senderName}: </span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>

            {/* Reaction Bar */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase">React:</span>
              <div className="flex gap-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => sendReaction(emoji)}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message to peers..."
                className="flex-1 px-3 py-2 text-xs bg-black/60 border border-border-subtle clip-chamfer-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-white clip-chamfer-sm text-xs font-semibold flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Architecture & Privacy Notice */}
      <div className="p-4 bg-bg-surface/50 border border-border-subtle clip-chamfer text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Peer-Resolution Architecture & Privacy Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Rooms exchange only source IDs (e.g. YouTube video IDs, Audius IDs, Jamendo IDs) and playback clock timestamps. Each client independently resolves and streams audio on their own machine. <strong>No audio files or streams are ever relayed through any central server.</strong>
        </p>
      </div>
    </div>
  );
};
