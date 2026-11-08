# Legacy Feature Inventory & Migration Map

This document exhaustively catalogs every feature, component, and utility present in the legacy `ChillCast` application (`./legacy/ChillCast`) and defines its exact destination and architectural enhancement in **MyuJiku v2**.

---

## 1. Architectural Transformation Summary

| Dimension | Legacy (`./legacy/ChillCast`) | MyuJiku v2 |
| :--- | :--- | :--- |
| **Platform** | Next.js 16 + React 19 + Electron 45 | Monorepo (pnpm): Tauri 2 (Rust) + React 19 + Vite SPA |
| **UI Paradigm** | Spotify clone (3 columns, left sidebar, right now-playing, green accents) | **Stage-First**: Hero lyrics canvas, floating vertical Dock, floating Capsule player expanding into Deck, chamfered/faceted low-poly cat visual identity |
| **Audio Engine** | Webview HTMLAudioElement / YouTube iframe fallback | Modular Web Audio API chain (8D, muffled, vinyl, dual vinyl, ambient mixer, EQ) with Rust-backed stream loopback |
| **YouTube Source** | Direct YouTube iframe embed only | Local `yt-dlp` tool manager in Rust + JS runtime + loopback proxy with strict privacy/no-audio-persistence; official embed fallback |
| **Local Library** | Simple single-file drag/drop or basic input | Recursive file scanner, watcher, `lofty` ID3/FLAC/Vorbis metadata extraction, SQLite database, custom upload parity |
| **Music Catalog** | Spotify Web API + YouTube embeds | Multi-source provider architecture: YouTube (yt-dlp), Local Files, Audius API, Jamendo CC API, Archive.org |
| **Lyrics Parser** | Inlined parser utilities in Next.js | Standalone framework-free `@myujiku/shared` package with full Enhanced-LRC & standard LRC parser/writer, unit tested |
| **Word Sync Aligner**| Basic caption aligner heuristic | Dedicated Python FastAPI forced-alignment service (`services/aligner`) powered by Whisper/stable-ts with window-constrained fallback |
| **Theme System** | Hardcoded Tailwind classes + partial CSS vars | Dynamic OKLCH design tokens, contrast validation, live CSS variables, Light/Dark/AMOLED, custom themes JSON import/export |
| **Social / Rooms** | Supabase real-time rooms (Next.js server) | Supabase client in desktop SPA + client-side peer sync via source ids (no audio relayed over server) |
| **Discord Presence**| Electron IPC / PreMiD bridge | Native Rust Discord RPC client integration with song details privacy toggle |

---

## 2. Exhaustive Feature Mapping

### A. Lyrics Core & Parsers

| Legacy File / Feature | Legacy Behavior | MyuJiku v2 Destination | Enhancements in v2 |
| :--- | :--- | :--- | :--- |
| `src/lib/lyrics/parseEnhancedLrc.ts` | Parses Enhanced LRC tags `[mm:ss.xx]word <mm:ss.xx>word` | `packages/shared/src/lyrics/parseEnhancedLrc.ts` | Strict typing, handles A2 form, CRLF, BOM, out-of-order markers, round-trip tests |
| `src/lib/lyrics/parseLrc.ts` | Parses standard LRC lines `[mm:ss.xx]Line` | `packages/shared/src/lyrics/parseLrc.ts` | Multi-timestamp line splitting, metadata extraction (`[ar:]`, `[ti:]`, `[al:]`, `[offset:]`) |
| `src/lib/lyrics/wordTiming.ts` | Derived character-weighted timing estimation | `packages/shared/src/lyrics/wordTiming.ts` | Punctuation pause weighting, syllable estimation, fallback integration for aligner |
| `src/lib/lyrics/transform.ts` | `lyricTime = speed * t + offset` math | `packages/shared/src/sync/transform.ts` | Isolated pure function, sub-millisecond precision, log-scale speed slider helper |
| `src/lib/lyrics/cleanTitle.ts`, `normalize.ts` | Cleans video titles (removes `[Official Music Video]`, etc.) | `packages/shared/src/normalizer/titleNormalizer.ts` | Enhanced regex dictionary, featured artist extraction, cross-source normalization |
| `src/lib/lyrics/providers/lrclib.ts` | LRCLIB API client | `apps/desktop/src/lyrics/providers/lrclib.ts` | Duration-tolerance checks, multiple query attempts, fallback ranking |
| `src/lib/lyrics/providers/netease.ts` | NetEase cloud music lyrics fetcher | `apps/desktop/src/lyrics/providers/netease.ts` | Multi-source fallback candidate |
| `src/lib/lyrics/providers/lyricsOvh.ts` | Lyrics.ovh provider | `apps/desktop/src/lyrics/providers/lyricsOvh.ts` | Plain-text lyrics fallback |
| `src/lib/lyrics/providers/youtubeCaptions.ts` | Scraped timed text from YouTube | `apps/desktop/src/lyrics/providers/youtubeCaptions.ts` | Formatted through yt-dlp subtitle extractor |
| `src/lib/lyrics/offsetRedis.ts` | Community offset storage | `apps/desktop/src/stores/lyricsStore.ts` & Supabase | Local SQLite cache + optional cloud community sync |

### B. Lyric Visual Stages & Effects

| Legacy File / Feature | Legacy Behavior | MyuJiku v2 Destination | Enhancements in v2 |
| :--- | :--- | :--- | :--- |
| `src/components/lyrics/styles/ClassicStage.tsx` | Vertical scrolling synced lyrics | `apps/desktop/src/components/stage/styles/ClassicStage.tsx` | Smooth spring scrolling, active line zoom, word-by-word highlight |
| `src/components/lyrics/styles/VisualStage.tsx` | Synced lyrics with inline word images/icons | `apps/desktop/src/components/stage/styles/VisualStage.tsx` | Illustrated icon set, smooth pop-in, adaptive typography |
| `src/components/lyrics/styles/ConstellationStage.tsx` | Floating 2D node graph connecting words | `apps/desktop/src/components/stage/styles/ConstellationStage.tsx` | Canvas/WebGL continuous chain, fading old nodes, slow camera zoom |
| `src/components/lyrics/styles/ShipStage.tsx` | 3D space flight through lyric stars | `apps/desktop/src/components/stage/styles/ShipStage.tsx` | WebGL/Three.js depth camera, random spawn/end trajectories, legible active focus |
| `src/components/lyrics/styles/CameraStage.tsx` | Kinetic typography with dynamic pan/zoom | `apps/desktop/src/components/stage/styles/CameraStage.tsx` | Smooth camera transitions, subtle/cinematic modes, depth-of-field |
| `src/components/lyrics/styles/FisheyeStage.tsx` | Spherical lens distortion effect | `apps/desktop/src/components/stage/styles/FisheyeStage.tsx` | True spherical lens shader, centered, curved on both X and Y axes |
| *Inverted Fisheye Stage* (Spec) | Pinch/liquid-warp with neon gradient + grain | `apps/desktop/src/components/stage/styles/InvertedFisheyeStage.tsx` | Full GLSL fragment shader, reactive pulse, chromatic aberration |
| `src/components/lyrics/styles/CodestyleStage.tsx` | Code editor / IDE syntax-themed lyrics | `apps/desktop/src/components/stage/styles/CodestyleStage.tsx` | Line numbers, terminal cursor blinking, syntax tokens |
| `src/components/lyrics/styles/BranchesStage.tsx` | Tree/branch growth with lyrical leaves | `apps/desktop/src/components/stage/styles/BranchesStage.tsx` | Generative branching canvas, organic swaying, blooming active words |
| `src/components/lyrics/styles/WebStage.tsx` | Spiderweb/interconnected semantic graph | `apps/desktop/src/components/stage/styles/WebStage.tsx` | Force-directed nodes, vibration on audio beats |
| `src/lib/lyrics/visuals/lexicon/*` (20 files) | 2,000+ words classified into 17 domains | `packages/shared/src/lexicon/*` | Clean TS dictionary, zero runtime deps, fast Trie lookup |
| `src/lib/lyrics/visuals/effects/catalog.ts` | 49 particle/animation word effects | `packages/shared/src/visuals/catalog.ts` & `apps/desktop/src/components/stage/effects/` | Flash-safety budget, FPS-throttled canvas/WebGL, intense effects killswitch |
| `src/components/lyrics/EdgeGlow.tsx` | Screen-edge ambient glow | `apps/desktop/src/components/stage/EdgeGlow.tsx` | 11 styles: ring, corners, bars, vignette, spotlight, aurora, neon tube, conic, ripple, breathing |
| `src/lib/lyrics/chroma.ts` | RGB color cycling for words | `packages/shared/src/visuals/chroma.ts` | Deterministic word color hashing, OKLCH vibrancy |
| `src/components/lyrics/FloatingLyrics.tsx` | Picture-in-picture floating lyrics | `apps/desktop/src/components/shell/FloatingMiniLyrics.tsx` | Floating widget when exploring other pages or mini-player window |

### C. Audio Engine & Soundscapes

| Legacy File / Feature | Legacy Behavior | MyuJiku v2 Destination | Enhancements in v2 |
| :--- | :--- | :--- | :--- |
| `src/components/UniversalMusicPlayer.tsx` | Next.js audio switcher | `apps/desktop/src/audio/AudioEngine.ts` | Full Web Audio API graph: Gain -> BiquadFilter (Muffled) -> Panner3D (8D Audio) -> Vinyl Node -> Master -> AnalyserNode |
| `src/components/AmbientSoundMixer.tsx` & `src/lib/ambient-engine.ts` | 10 audio ambient loops | `apps/desktop/src/audio/AmbientMixer.ts` | Seamless loop buffering, individual channel volume, presets |
| `src/components/DualVinylMixer.tsx` | Two-deck vinyl scratching simulation | `apps/desktop/src/components/mixer/DualVinylDeck.tsx` | Realistic scratch physics, pitch shifting, crackle/needle simulation |
| `public/audio/*.mp3` | Rain, crickets, thunder, etc. | `apps/desktop/public/audio/*.mp3` | Bundled directly with offline installer |
| *Muffled / 8D / Dual Vinyl* | Basic filters | `apps/desktop/src/audio/effects/` | True spherical 8D panning oscillator, low-pass muffled filter, Dual Vinyl crackle synthesis |

### D. Navigation & UI Shell

| Legacy Component | Legacy Look & Behavior | MyuJiku v2 Replacement |
| :--- | :--- | :--- |
| `src/components/spotify/SpotifyTopNav.tsx` | Top bar with search input, profile pill | Replaced by **Floating Dock** + **Command Palette (Ctrl+K)** |
| `src/components/spotify/SpotifySidebar.tsx` | Left vertical playlist sidebar | Replaced by **Floating Dock** (Stage, Library, Discover, Rooms, Mixer, Settings) |
| `src/components/spotify/SpotifyBottomPlayer.tsx`| Full-width 90px bottom bar | Replaced by **Floating Capsule** (bottom-center) expanding into **Deck** |
| `src/components/spotify/SpotifyNowPlayingPanel.tsx` | Right fixed column | Integrated into **Deck** and **Stage Canvas** |
| `src/components/lyrics/InspectModal.tsx` | Effect debug dialog | `apps/desktop/src/components/inspect/InspectModal.tsx` (7 taps on logo, FPS counter, engine state, log export) |
| `src/app/credits/page.tsx` | Web credits page | `apps/desktop/src/components/credits/CreditsModal.tsx` (Manifest-driven source licenses, asset attributions) |

### E. Social, Discord & Accounts

| Legacy Component | Legacy Implementation | MyuJiku v2 Replacement |
| :--- | :--- | :--- |
| `src/lib/rooms/*` & `src/components/rooms/*` | Supabase Realtime rooms (lobby, chat, skip votes) | `apps/desktop/src/rooms/` with P2P drift-correcting clock sync (store source IDs only) |
| `src/lib/discord/discord-presence.ts` | PreMiD bridge / Electron IPC | `apps/desktop/src-tauri/src/discord/` native IPC using Discord RPC crate with privacy toggle |
| `src/app/auth/*` | Next.js server actions + cookies | Supabase Auth PKCE flow via system browser + `myujiku://` deep-link callback |

---

## 3. Strict Parity Verification Rule
Every single feature listed above is tracked in `docs/PROGRESS.md` and verified in `docs/parity-matrix.md`. No legacy capability will be omitted.

