import { invoke } from '@tauri-apps/api/core';
import { Track } from '@myujiku/shared';

export interface DiscordRpcStatus {
  connected: boolean;
  application_id: string;
  last_error: string | null;
}

export interface DiscordPresencePayload {
  title: string;
  artist: string;
  album?: string;
  duration_secs?: number;
  elapsed_secs?: number;
  room_code?: string;
  cover_url?: string;
  hide_details: boolean;
}

export class DiscordClient {
  private static instance: DiscordClient;

  public static getInstance(): DiscordClient {
    if (!DiscordClient.instance) {
      DiscordClient.instance = new DiscordClient();
    }
    return DiscordClient.instance;
  }

  /**
   * Updates Discord Rich Presence through the Rust native IPC client
   */
  public async setActivity(
    track: Track,
    elapsedSecs = 0,
    roomCode?: string,
    hideDetails = false
  ): Promise<void> {
    try {
      const payload: DiscordPresencePayload = {
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration_secs: track.duration,
        elapsed_secs: elapsedSecs,
        room_code: roomCode,
        cover_url: track.artworkUrl,
        hide_details: hideDetails,
      };

      await invoke('set_discord_activity', { data: payload });
    } catch {
      // Discord IPC is best-effort (e.g. desktop app not open)
    }
  }

  /**
   * Clears Discord Rich Presence
   */
  public async clearActivity(): Promise<void> {
    try {
      await invoke('clear_discord_activity');
    } catch {
      // Best-effort
    }
  }

  /**
   * Retrieves current Discord RPC status
   */
  public async getStatus(): Promise<DiscordRpcStatus> {
    try {
      return await invoke<DiscordRpcStatus>('get_discord_status');
    } catch {
      return {
        connected: false,
        application_id: '1567903090177343499',
        last_error: 'Tauri RPC invocation failed',
      };
    }
  }

  /**
   * Posts a formatted "Now Playing" rich embed to a Discord Webhook
   */
  public async sendNowPlayingWebhook(
    webhookUrl: string,
    track: Track,
    lyricsSnippet?: string
  ): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return false;
    }

    try {
      const embed = {
        title: `🎵 Now Playing: ${track.title}`,
        description: `**Artist:** ${track.artist}${track.album ? `\n**Album:** ${track.album}` : ''}${
          lyricsSnippet ? `\n\n> *"${lyricsSnippet}"*` : ''
        }`,
        color: 0x38bdf8, // Accent sky-blue
        thumbnail: track.artworkUrl ? { url: track.artworkUrl } : undefined,
        footer: {
          text: 'MyuJiku v2 — Desktop Synced Lyrics',
          icon_url: 'https://raw.githubusercontent.com/xhinzu/ChillCast-/main/public/favicon.ico',
        },
        timestamp: new Date().toISOString(),
      };

      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'MyuJiku Player',
          avatar_url: 'https://raw.githubusercontent.com/xhinzu/ChillCast-/main/public/favicon.ico',
          embeds: [embed],
        }),
      });

      return resp.ok;
    } catch {
      return false;
    }
  }

  /**
   * Formats text for copying to Discord Custom Status
   */
  public formatCustomStatus(track: Track): string {
    return `🎵 Listening to ${track.title} - ${track.artist} on MyuJiku`;
  }
}

