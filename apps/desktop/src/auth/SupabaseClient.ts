import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Default public/fallback demo endpoint or user configurable
const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://myujiku-demo.supabase.co';
const DEFAULT_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.demo';

export class SupabaseManager {
  private static instance: SupabaseManager;
  public client: SupabaseClient;
  public isMockMode = false;

  private constructor() {
    try {
      this.client = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
        auth: {
          flowType: 'pkce',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    } catch {
      this.isMockMode = true;
      this.client = null as unknown as SupabaseClient;
    }
  }

  public static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager();
    }
    return SupabaseManager.instance;
  }

  /**
   * Triggers Discord OAuth with desktop custom protocol callback
   */
  public async signInWithDiscord(): Promise<{ url?: string; error?: string }> {
    if (this.isMockMode) {
      return { error: 'Supabase credentials not configured' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: 'myujiku://auth/callback',
          skipBrowserRedirect: true,
        },
      });

      if (error) return { error: error.message };
      return { url: data.url };
    } catch (err: unknown) {
      return { error: (err as Error).message };
    }
  }

  /**
   * Sign in with Email / Password
   */
  public async signInWithEmail(email: string, pass: string): Promise<{ user?: User; error?: string }> {
    if (this.isMockMode) {
      return { error: 'Offline mode — accounts are optional' };
    }

    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) return { error: error.message };
      return { user: data.user };
    } catch (err: unknown) {
      return { error: (err as Error).message };
    }
  }

  /**
   * Sign up with Email / Password
   */
  public async signUpWithEmail(email: string, pass: string): Promise<{ user?: User; error?: string }> {
    if (this.isMockMode) {
      return { error: 'Offline mode — accounts are optional' };
    }

    try {
      const { data, error } = await this.client.auth.signUp({
        email,
        password: pass,
      });

      if (error) return { error: error.message };
      return { user: data.user || undefined };
    } catch (err: unknown) {
      return { error: (err as Error).message };
    }
  }

  /**
   * Sign out
   */
  public async signOut(): Promise<void> {
    if (!this.isMockMode && this.client) {
      await this.client.auth.signOut();
    }
  }

  /**
   * Handle deep link token parsing (e.g. from myujiku://auth/callback#access_token=...)
   */
  public async handleDeepLinkCallback(url: string): Promise<Session | null> {
    if (this.isMockMode || !this.client) return null;

    try {
      if (url.includes('#') || url.includes('?')) {
        const hash = url.split('#')[1] || url.split('?')[1];
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data } = await this.client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          return data.session;
        }
      }
    } catch {
      // Ignore invalid deep links
    }
    return null;
  }
}

