# MyuJiku v2 — Desktop Application Guide

## Architecture Overview

MyuJiku v2 is built from the ground up as a native Windows desktop music player with synchronized word-by-word lyrics:
- **Core Engine**: Tauri 2 with a native Rust backend (`apps/desktop/src-tauri/`) handling high-performance tasks: local audio file metadata extraction (`lofty`), loopback range-proxy, SQLite database (`rusqlite`), Discord RPC named-pipe client, and sidecar management.
- **Frontend SPA**: React 19, TypeScript (strict), Vite, and Tailwind CSS.
- **Shared Logic**: `@myujiku/shared` containing framework-free OKLCH design tokens, WCAG contrast verification, Enhanced LRC parsers/writers, and lyric transform math.
- **DSP Audio Pipeline**: Web Audio API (`AudioContext`) with an effects chain (8D LFO panning, biquad muffled filter, vinyl needle noise, and real-time `AnalyserNode`).
- **Aligner Sidecar**: Standalone Python 3.11+ FastAPI service (`services/aligner`) executing window-constrained forced alignment.

---

## Storage Layout

All persistent application data is strictly organized and never stored outside designated paths:

| Path | Purpose | Persistence |
| :--- | :--- | :--- |
| `F:\vbcode\tools\` | External tools: `yt-dlp.exe` and `qjs.exe` (QuickJS-NG) | Persistent |
| `F:\vbcode\releases\` | Built installers and NSIS executable artifacts | Persistent |
| `App Data / myujiku.db` | Local SQLite database (indexed tracks, playlists, likes, play history) | Persistent |
| `%TEMP%\myujiku-cache\` | Ephemeral YouTube playback cache (capped at 500 MB, LRU eviction) | **Wiped on exit & launch** |

> [!IMPORTANT]
> Under no circumstances does MyuJiku persist YouTube audio streams to disk. The 500 MB temporary cache is strictly ephemeral and completely purged when the application closes or starts up.

---

## Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Space` | Toggle Play / Pause | Global |
| `←` / `→` | Seek backward / forward 5 seconds | Global |
| `[` | Nudge lyric synchronization offset by -0.1s | Lyrics Stage |
| `]` | Nudge lyric synchronization offset by +0.1s | Lyrics Stage |
| `M` | Toggle Audio Mute | Global |
| `S` | Toggle Shuffle | Global |
| `R` | Cycle Repeat (Off → All → One) | Global |
| `Ctrl + K` | Open Command Palette | Global |
| `Ctrl + /` or `?` | Open Keyboard Shortcuts & Help Modal | Global |
| `Ctrl + 1` | Switch to Lyrics Stage View | Global |
| `Ctrl + 2` | Switch to Local & Saved Library | Global |
| `Ctrl + 3` | Switch to Discover (YouTube, Audius, Jamendo) | Global |
| `Ctrl + 4` | Switch to Ambient Soundscape Mixer | Global |
| `Ctrl + 5` | Switch to Listen Together Rooms | Global |
| `Ctrl + 6` | Switch to Settings | Global |
| `F` | Toggle Fullscreen | Global |
| `Esc` | Close Drawer / Modal / Return to Stage | Global |

---

## Deep Link Scheme (`myujiku://`)

The desktop application registers the `myujiku://` custom URI scheme:
- `myujiku://auth/callback`: Handles PKCE OAuth redirection callbacks from Discord and Supabase Auth.
- `myujiku://room/<code>`: Automatically opens and joins a Listen Together room session.

---

## Offline Usage & Account-Free Design

MyuJiku is designed with a **local-first philosophy**:
1. **Zero Account Requirement**: The application is 100% functional without creating or signing into any account.
2. **Local Music & Lyrics**: All local audio formats (`.mp3`, `.flac`, `.wav`, `.ogg`, `.m4a`, `.opus`) and sidecar lyrics (`.lrc`, `.elrc`) work offline.
3. **Local DSP Effects**: All audio effects (8D audio, muffled filter, vinyl noise) and ambient soundscapes are generated or synthesized locally on the device.
4. **Local Word Alignment**: The Python aligner runs as a local sidecar service, requiring no cloud connection or external API keys.

---

## Performance Targets

- **Cold Start**: < 2.0s to interactive stage.
- **Idle CPU**: < 2% CPU utilization with static lyric stage.
- **Audio Latency**: Sub-10ms buffer latency via Web Audio API.
- **Clock Drift**: Synchronized Listen Together rooms drift-corrected within 50ms.

