import React, { useState } from 'react';
import { Users, Radio, ShieldCheck, KeyRound, Plus, ArrowRight } from 'lucide-react';

export const RoomsView: React.FC = () => {
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length !== 6) return;
    alert(`Joining room: ${roomCode.toUpperCase()}`);
  };

  const handleCreate = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    alert(`Created room: ${randomCode}`);
  };

  return (
    <div className="w-full h-full p-8 max-w-4xl mx-auto space-y-6 animate-fade-in overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-xl font-bold tracking-wider uppercase text-white">Listen Together (Rooms)</h1>
            <p className="text-xs text-zinc-400">Synchronized word-level listening sessions with friends</p>
          </div>
        </div>
      </div>

      {/* Join or Create Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Join by Code */}
        <div className="p-6 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2.5 text-accent">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Join Existing Room</h3>
          </div>
          <p className="text-xs text-zinc-400">Enter a 6-character invite code to join an active session:</p>
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. MYUJIK"
              className="w-full px-4 py-3 bg-bg-elevated/60 border border-border-subtle clip-chamfer-sm text-center text-lg font-mono font-bold tracking-widest text-white uppercase focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={roomCode.length !== 6}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white text-xs font-semibold uppercase tracking-wider clip-chamfer-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_var(--color-accent-glow)]"
            >
              <span>Join Room</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Create Room */}
        <div className="p-6 bg-bg-surface/80 border border-border-base clip-chamfer backdrop-blur-md flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-accent">
              <Radio className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Host a Room</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Create a shared listening session with authoritative host playback controls, synchronized lyric clock, and skip voting.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="w-full py-2.5 bg-bg-elevated hover:bg-white/10 border border-border-subtle text-white text-xs font-semibold uppercase tracking-wider clip-chamfer-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-accent" />
            <span>Create New Room</span>
          </button>
        </div>
      </div>

      {/* Architecture & Privacy Notice */}
      <div className="p-4 bg-bg-surface/50 border border-border-subtle clip-chamfer text-xs text-zinc-400 space-y-2">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Peer-Resolution Architecture & Privacy Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Rooms exchange only source IDs (e.g. YouTube IDs, Audius IDs, Jamendo IDs) and playback clock timestamps. Each client independently resolves and streams audio on their own machine. <strong>No audio files or streams are ever relayed through any central server.</strong>
        </p>
        <p className="text-[11px] text-zinc-500">
          Note: Local private audio files cannot be streamed to other listeners; the app will automatically suggest public catalog matches.
        </p>
      </div>
    </div>
  );
};
