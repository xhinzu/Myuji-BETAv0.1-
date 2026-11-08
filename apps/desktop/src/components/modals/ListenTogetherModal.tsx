import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  X,
  Share2,
  LogOut,
  Send,
  Sparkles,
  Radio,
  Vote,
} from 'lucide-react';
import { useRoomStore } from '../../stores/roomStore';
import { usePlayerStore } from '../../stores/playerStore';

interface ListenTogetherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ListenTogetherModal: React.FC<ListenTogetherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    isInRoom,
    roomCode,
    isHost,
    members,
    chatMessages,
    recentReactions,
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-bg-surface border border-border-base clip-chamfer shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-elevated/40">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-accent animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Listen Together {isInRoom && `• Room ${roomCode}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Reactions Overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center gap-4 z-40 overflow-hidden">
          {recentReactions.map((r) => (
            <div
              key={r.id}
              className="text-3xl animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {!isInRoom ? (
            /* Create / Join State */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Create Room */}
              <div className="p-5 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-sm font-bold text-white">Host a Room</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Create a synchronized room. Friends join via 6-digit code or link. No audio is streamed; each peer independently resolves from source with 50ms clock alignment.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your Name (e.g. Sreed)"
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-border-subtle clip-chamfer-sm text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => createRoom(userName)}
                    className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider clip-chamfer-sm shadow-[0_0_15px_var(--color-accent-glow)] transition-all"
                  >
                    Create Room
                  </button>
                </div>
              </div>

              {/* Join Room */}
              <div className="p-5 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-white mb-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Join a Room</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Enter a 6-character room code shared by your friend to jump straight into synced playback with democratic voting.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="Room Code (e.g. MYU-892)"
                    maxLength={7}
                    className="w-full px-3 py-2 text-xs bg-black/60 border border-border-subtle clip-chamfer-sm text-white font-mono placeholder-zinc-500 text-center uppercase tracking-widest focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    disabled={!inputCode.trim()}
                    onClick={() => joinRoom(inputCode, userName || 'Friend')}
                    className="w-full py-2.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle text-white text-xs font-bold uppercase tracking-wider clip-chamfer-sm disabled:opacity-40 transition-all"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Room State */
            <div className="space-y-5">
              {/* Room Code & Share Banner */}
              <div className="p-4 bg-accent/10 border border-accent/30 clip-chamfer-sm flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-accent tracking-widest block">
                    Active Room Code
                  </span>
                  <span className="text-2xl font-mono font-bold text-white tracking-widest">
                    {roomCode}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle clip-chamfer-sm text-xs text-zinc-300"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white clip-chamfer-sm text-xs font-semibold"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>

              {/* Members & Controls Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Members list */}
                <div className="p-3 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm">
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-2">
                    <span>Peers Connected ({members.length})</span>
                    <span className="text-emerald-400 text-[10px]">● Clock Synced (&lt;50ms)</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-black/40 rounded text-xs text-white"
                      >
                        <span className="font-semibold flex items-center gap-1.5">
                          {m.name}
                          {m.isHost && <span className="text-[9px] bg-accent/30 text-accent px-1.5 py-0.2 rounded font-mono">HOST</span>}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">{m.pingMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Democratic Skip Voting & Mode */}
                <div className="p-3 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold mb-2">
                      <span>Room Governance</span>
                      {isHost && (
                        <button
                          type="button"
                          onClick={toggleDemocraticMode}
                          className="text-[10px] text-accent hover:underline"
                        >
                          {isDemocratic ? 'Switch to Host Only' : 'Switch to Democratic'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300">
                      Mode: <span className="text-white font-bold">{isDemocratic ? 'Democratic (Vote-to-Skip)' : 'Host-Controlled'}</span>
                    </p>
                    {currentTrack && (
                      <p className="text-[11px] text-zinc-400 mt-1 truncate">
                        Now Playing: <span className="text-white font-semibold">{currentTrack.title}</span>
                      </p>
                    )}
                  </div>

                  {isDemocratic && (
                    <button
                      type="button"
                      onClick={() => voteToSkip(members[0]?.id || 'me')}
                      className="mt-3 w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 clip-chamfer-sm text-xs font-bold flex items-center justify-center gap-2"
                    >
                      <Vote className="w-3.5 h-3.5" />
                      <span>Vote to Skip ({skipVotes.length}/{Math.ceil(members.length / 2)} votes)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Chat & Reaction Feed */}
              <div className="p-3 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm space-y-3">
                <div className="text-xs text-zinc-400 font-semibold">Room Chat</div>
                <div className="h-32 overflow-y-auto space-y-1.5 pr-2 font-mono text-xs">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-zinc-300">
                      <span className="text-accent font-semibold">{msg.senderName}: </span>
                      <span>{msg.text}</span>
                    </div>
                  ))}
                </div>

                {/* Reaction Quick Bar */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase">React:</span>
                  <div className="flex gap-1.5">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => sendReaction(emoji)}
                        className="text-base hover:scale-125 transition-transform"
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
                    placeholder="Type a message to room..."
                    className="flex-1 px-3 py-1.5 text-xs bg-black/60 border border-border-subtle clip-chamfer-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-accent text-white clip-chamfer-sm text-xs font-semibold flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </form>
              </div>

              {/* Leave Room Action */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 clip-chamfer-sm text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Room</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
