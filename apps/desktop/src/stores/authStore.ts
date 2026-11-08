import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { SupabaseManager } from '../auth/SupabaseClient';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signInWithDiscord: () => Promise<string | null>;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  handleDeepLink: (url: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  error: null,

  signInWithDiscord: async () => {
    set({ isLoading: true, error: null });
    const mgr = SupabaseManager.getInstance();
    const res = await mgr.signInWithDiscord();
    set({ isLoading: false, error: res.error || null });
    return res.url || null;
  },

  signInWithEmail: async (email, pass) => {
    set({ isLoading: true, error: null });
    const mgr = SupabaseManager.getInstance();
    const res = await mgr.signInWithEmail(email, pass);
    if (res.user) {
      set({ user: res.user, isLoading: false, error: null });
      return true;
    }
    set({ isLoading: false, error: res.error || 'Failed to sign in' });
    return false;
  },

  signUpWithEmail: async (email, pass) => {
    set({ isLoading: true, error: null });
    const mgr = SupabaseManager.getInstance();
    const res = await mgr.signUpWithEmail(email, pass);
    if (res.user) {
      set({ user: res.user, isLoading: false, error: null });
      return true;
    }
    set({ isLoading: false, error: res.error || 'Failed to sign up' });
    return false;
  },

  signOut: async () => {
    set({ isLoading: true });
    const mgr = SupabaseManager.getInstance();
    await mgr.signOut();
    set({ user: null, session: null, isLoading: false, error: null });
  },

  handleDeepLink: async (url: string) => {
    const mgr = SupabaseManager.getInstance();
    const session = await mgr.handleDeepLinkCallback(url);
    if (session) {
      set({ session, user: session.user, error: null });
      return true;
    }
    return false;
  },
}));

