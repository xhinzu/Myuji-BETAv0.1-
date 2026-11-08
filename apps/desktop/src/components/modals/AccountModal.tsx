import React, { useState } from 'react';
import {
  User as UserIcon,
  X,
  Mail,
  Lock,
  LogOut,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isLoading,
    error,
    signInWithDiscord,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDiscord = async () => {
    const url = await signInWithDiscord();
    if (url) {
      // In desktop app, open browser for PKCE OAuth redirect to myujiku://auth/callback
      window.open(url, '_blank');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!email || !password) return;

    if (mode === 'signin') {
      const ok = await signInWithEmail(email, password);
      if (ok) {
        setFeedback('Signed in successfully!');
        setTimeout(() => onClose(), 1500);
      }
    } else {
      const ok = await signUpWithEmail(email, password);
      if (ok) {
        setFeedback('Account created! Please check your email for confirmation.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-bg-surface border border-border-base clip-chamfer shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-elevated/40">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {user ? 'Account Profile' : 'MyuJiku Account'}
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

        {/* Optional Account Notice */}
        <div className="px-6 py-2.5 bg-accent/10 border-b border-accent/20 flex items-center gap-2 text-[11px] text-accent">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Accounts are completely optional. Offline playback, local library, YouTube, and effects work 100% without sign-in.</span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {user ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-bg-elevated/40 border border-border-subtle clip-chamfer-sm">
                <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent flex items-center justify-center font-bold text-accent text-sm">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-white truncate">{user.email || 'Discord User'}</p>
                  <p className="text-[10px] text-zinc-400 font-mono">ID: {user.id.substring(0, 8)}...</p>
                </div>
              </div>

              <button
                type="button"
                onClick={signOut}
                className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 clip-chamfer-sm font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Sign in / Sign up state */
            <div className="space-y-4">
              {/* Discord OAuth Button */}
              <button
                type="button"
                onClick={handleDiscord}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold clip-chamfer-sm flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                <span>Continue with Discord</span>
              </button>

              <div className="flex items-center gap-3 text-zinc-500 my-2">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-[10px] uppercase font-semibold">Or with email</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">Email</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-black/60 border border-border-subtle clip-chamfer-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-400 block">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-black/60 border border-border-subtle clip-chamfer-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {error && <p className="text-[11px] text-rose-400">{error}</p>}
                {feedback && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{feedback}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-accent hover:bg-accent-hover text-white font-bold uppercase tracking-wider clip-chamfer-sm shadow-md"
                >
                  {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-zinc-400 hover:text-white text-[11px] underline"
                >
                  {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
