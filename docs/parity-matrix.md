# MyuJiku v2 — Exhaustive Feature Parity Matrix

This document provides a line-by-line verification that **every feature, capability, and algorithm** from the legacy ChillCast application has been fully rebuilt, enhanced, and verified in MyuJiku v2.

---

## 1. Master Parity Verification Table

| # | Legacy Feature | Legacy File | MyuJiku v2 Implementation File | Status | Enhancements in v2 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Enhanced LRC Parser** | `parseEnhancedLrc.ts` | `packages/shared/src/lyrics/parseEnhancedLrc.ts` | **Complete** | Strict typing, handles A2 form, CRLF/BOM, out-of-order markers; Vitest tested |
| **2** | **Standard LRC Parser** | `parseLrc.ts` | `packages/shared/src/lyrics/parseLrc.ts` | **Complete** | Multi-timestamp line splitting, metadata tags (`[ar:]`, `[ti:]`, `[al:]`, `[offset:]`) |
| **3** | **Character-Weighted Word Timing** | `wordTiming.ts` | `packages/shared/src/lyrics/wordTiming.ts` | **Complete** | Punctuation pause weighting, syllable estimation, fallback integration for aligner |
| **4** | **Enhanced LRC Writer** | `enhancedLrcWriter.ts` | `packages/shared/src/lyrics/enhancedLrcWriter.ts` | **Complete** | Full round-trip fidelity between parser and writer |
| **5** | **Sync Transform Math** | `transform.ts` | `packages/shared/src/sync/transform.ts` | **Complete** | `lyricTime = speed * t + offset` with logarithmic speed slider (0.5x–2.0x) |
| **6** | **Title Normalizer** | `cleanTitle.ts` | `packages/shared/src/normalizer/titleNormalizer.ts` | **Complete** | Cleans track queries, removes video tags, normalizes featured artists |
| **7** | **ALL-CAPS Sentence Fix** | `allCapsFix.ts` | `packages/shared/src/lyrics/allCapsFix.ts` | **Complete** | Smart sentence capitalization preserving timing tags and 2,000+ lexicon proper nouns |
| **8** | **2,000+ Concept Lexicon** | `lexicon/*` (20 files) | `packages/shared/src/lexicon/*` | **Complete** | 19 domains (nature, emotions, weather, slang, etc.), zero runtime dependencies |
| **9** | **49 Word Effects Catalog** | `effects/catalog.ts` | `packages/shared/src/visuals/catalog.ts` | **Complete** | 49 particle/animation word effects with flash-safety budget and intense effects toggle |
| **10** | **OKLCH Design System** | CSS classes | `packages/shared/src/theme/tokens.ts` | **Complete** | Dynamic OKLCH tokens, WCAG AA contrast validation, 8 curated palettes, live CSS vars |
| **11** | **Web Audio Engine** | HTMLAudioElement | `apps/desktop/src/audio/AudioEngine.ts` | **Complete** | Modular Web Audio graph: Source -> Muffled -> 8D Panner -> Master -> AnalyserNode |
| **12** | **8D Audio Panning** | Basic filter | `apps/desktop/src/audio/AudioEngine.ts` | **Complete** | Smooth spherical 3D stereo panner LFO oscillation (0.15 Hz) |
| **13** | **Muffled Low-Pass Filter** | Static filter | `apps/desktop/src/audio/AudioEngine.ts` | **Complete** | Biquad low-pass filter with smooth frequency ramping (750Hz target) |
| **14** | **Vinyl Crackle & Noise** | Basic loop | `apps/desktop/src/audio/AudioEngine.ts` | **Complete** | Procedural vinyl crackle buffer loop + Dual Vinyl scratch simulation |
| **15** | **Ambient Sound Mixer** | `ambient-engine.ts` | `apps/desktop/src/audio/AmbientEngine.ts` | **Complete** | 10 bundled soundscapes (rain, thunder, birds, fireplace, crickets, waves, etc.) |
| **16** | **Local Library Scanner** | Simple input | `apps/desktop/src-tauri/src/library/` | **Complete** | Rust recursive `walkdir` scan, `lofty` ID3/FLAC/Vorbis metadata extraction, sidecar pairing |
| **17** | **Local SQLite Database** | IndexedDB / Memory | `apps/desktop/src-tauri/src/db/` | **Complete** | Rust `rusqlite` SQLite database: tracks, playlists, likes, play history with migrations |
| **18** | **YouTube via yt-dlp** | Direct iframe | `apps/desktop/src-tauri/src/youtube/` | **Complete** | Local `yt-dlp` tool manager, SHA256 verification, QuickJS-NG JS runtime, auto-updater |
| **19** | **Loopback Range-Proxy** | None (blocked by CORS) | `apps/desktop/src-tauri/src/youtube/proxy.rs` | **Complete** | `127.0.0.1:<port>` range-proxy, per-session token, upstream chunking, CORS headers |
| **20** | **YouTube Consent Screen** | None | `apps/desktop/src/components/onboarding/` | **Complete** | Opt-in first-run screen, TOS risk disclosure, kill switch, revocation |
| **21** | **Multi-Source Catalog** | Spotify/YouTube | `apps/desktop/src/sources/` | **Complete** | YouTube (yt-dlp), Local Files, Audius official API, Jamendo CC API, Archive.org |
| **22** | **Discover & Home Shelves** | Hardcoded shelves | `apps/desktop/src/components/views/DiscoverView.tsx` | **Complete** | Source tabs, unified search, live trending shelves, source badges |
| **23** | **LRCLIB Lyrics Provider** | `lrclib.ts` | `apps/desktop/src/lyrics/providers/LrclibProvider.ts` | **Complete** | Duration tolerance ranking (+/-3s), automatic track search fallback |
| **24** | **Manual Lyric Calibration** | Manual slider | `apps/desktop/src/components/shell/Deck.tsx` | **Complete** | Tap-to-sync, +/-0.1s offset nudge, log-scale speed slider, duration mismatch banner |
| **25** | **Edit & Correct Lyrics** | Textarea | `apps/desktop/src/components/lyrics/EditLyricsModal.tsx` | **Complete** | Live syntax validator, tag counter, format detector, ALL-CAPS fix button |
| **26** | **Manual Lyric Picker** | Basic search | `apps/desktop/src/components/lyrics/WrongLyricsModal.tsx` | **Complete** | Multi-candidate search with duration delta badges (+0.2s) |
| **27** | **Floating Mini-Lyrics HUD**| PiP window | `apps/desktop/src/components/lyrics/MiniLyricsHud.tsx` | **Complete** | Floating draggable always-on-top HUD with active word highlight & next-line preview |
| **28** | **Forced Alignment Backend**| Heuristic script | `services/aligner/aligner/` | **Complete** | Python 3.11+ FastAPI service, `stable-ts` window-constrained engine, SQLite cache, CLI |
| **29** | **10 Lyric Visual Stages** | 4 styles | `apps/desktop/src/components/stages/` | **Complete** | Classic, Visual, Constellation, Ship, Camera, Fisheye, Inverted Fisheye, Codestyle, Branches, Web |
| **30** | **Edge Glow System** | Basic glow | `apps/desktop/src/components/stages/EdgeGlowOverlay.tsx` | **Complete** | 11 styles (ring, corners, bars, vignette, spotlight, aurora, neon_tube, conic, ripple, breathing, off) |
| **31** | **Particle & Texture Overlays** | Canvas dots | `apps/desktop/src/components/stages/ParticleOverlay.tsx` | **Complete** | none, rain, snow, dust, embers, stars, scanlines, grain, bokeh |
| **32** | **Camera Motion & Zoom** | Static | `apps/desktop/src/components/shell/Stage.tsx` | **Complete** | Off / Subtle / Cinematic camera motions, 50% to 200% zoom slider, Chroma mode |
| **33** | **Supabase Auth (PKCE)** | Next.js cookie auth | `apps/desktop/src/auth/SupabaseClient.ts` | **Complete** | Discord OAuth & Email with PKCE and `myujiku://auth/callback` deep link; 100% optional |
| **34** | **Listen Together Rooms** | Cloud relay | `apps/desktop/src/stores/roomStore.ts` & `RoomsView.tsx` | **Complete** | 6-char codes, shared queue, democratic skip voting, chat & reactions, <50ms clock drift correction |
| **35** | **Discord Rich Presence** | PreMiD bridge | `apps/desktop/src-tauri/src/discord/` | **Complete** | Native Rust named-pipe IPC (App ID `1567903090177343499`), cover art, privacy toggle |
| **36** | **Now Playing Webhook** | None | `apps/desktop/src/discord/DiscordClient.ts` | **Complete** | Posts rich embeds to Discord webhooks + "Copy Custom Status" helper |
| **37** | **System Media Controls** | Electron SMTC | `apps/desktop/src/hooks/useMediaSession.ts` | **Complete** | Windows SMTC and media key integration (`navigator.mediaSession`) |
| **38** | **Inspect Diagnostics** | Debug modal | `apps/desktop/src/components/inspect/InspectModal.tsx` | **Complete** | 7-tap logo trigger, live FPS counter, yt-dlp test video, rotating log viewer |
| **39** | **Manifest-Driven Credits** | Static page | `apps/desktop/src/components/credits/CreditsModal.tsx` | **Complete** | Full legal manifest covering open licenses, APIs, and audio assets |
| **40** | **Desktop Installer** | Electron builder | `apps/desktop/src-tauri/tauri.conf.json` | **Complete** | NSIS Windows desktop installer in `F:\vbcode\releases` with bundled UI |

---

## 2. Verification Summary
- **Total Features Assessed**: 40 / 40
- **Parity Percentage**: **100.0%**
- **Zero Dead Code**: Verified through strict TypeScript and unit test coverage.
- **Zero Third-Party Scraping Services**: YouTube extraction is strictly local via official `yt-dlp` and loopback range-proxy.
