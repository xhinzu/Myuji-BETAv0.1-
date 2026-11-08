# MyuJiku v2 — Progress & Implementation Checklist

This checklist tracks the implementation status of all features and components across all phases of the project.

**Current Phase:** Phase 4 COMPLETED. Transitioning to Phase 5 (All Lyric Styles & Visual Customization).

---

## Phase 0: Foundation
- [x] Workspace & Monorepo initialization (pnpm workspaces, strict TypeScript, base configs)
- [x] CI workflow configuration (`.github/workflows/ci.yml`)
- [x] Legacy Feature Inventory (`docs/legacy-feature-inventory.md` mapping EVERY legacy feature)
- [x] Architectural Decision Records (`docs/decisions/0001-architecture-and-monorepo.md`, `0002-theme-tokens-and-design-system.md`, `0003-desktop-shell-stage-dock-capsule-deck.md`, `0004-youtube-js-runtime-and-playback.md`)
- [x] `@myujiku/shared` package core types, design tokens, OKLCH math, contrast checker
- [x] Theme system with 8+ curated palettes, WCAG validation, JSON export/import, live CSS vars
- [x] Settings store with versioning, schema migration, and per-section reset
- [x] Desktop SPA Shell: Stage-First full-window canvas, floating Dock, floating Capsule player, expandable Deck
- [x] Command Palette (Ctrl+K) skeleton with keyboard navigation
- [x] First-run Onboarding & YouTube Consent screen (kill switch, TOS disclaimer, local-only notice)
- [x] Inspect Modal (7 quick taps on logo / press-hold, FPS counter, diagnostics, state inspector)
- [x] Credits & Licenses page skeleton (manifest-driven)
- [x] Phase 0 unit tests (24/24 Vitest), cargo check (MSVC clean), tsc strict typecheck, and pytest passing!

---

## Phase 1: Audio Engine & Local Library
- [x] Modular Web Audio API engine (Gain, Master, AnalyserNode, live timeupdate callbacks)
- [x] Effects chain: 8D Audio (stereo panner LFO oscillator), Muffled (biquad low-pass ramp), Vinyl / Dual Vinyl crackle & surface noise simulation
- [x] Ambient sound mixer with 10 bundled soundscapes (rain, thunder, birds, fireplace, crickets, etc.)
- [x] Playback core: play, pause, seek, +/-5s skips, volume, loop (off/all/one), shuffle, gapless buffering
- [x] Queue management (reorder, remove, clear, history)
- [x] Rust Local Library scanner: recursive folder scan, `walkdir`, `lofty` metadata extraction (ID3, FLAC, Vorbis)
- [x] Local SQLite database for library, playlists, likes, play history with full migrations
- [x] Drag-and-drop audio & lyric file import ("Upload custom audio" parity with sidecar pairing)
- [x] Mini-player window mode (`toggle_mini_player` Tauri command)
- [x] Media keys and Windows system media transport controls (SMTC / `navigator.mediaSession`)

---

## Phase 2: Multi-Source Architecture (YouTube, Audius, Jamendo, Archive)
- [x] Provider architecture: `TrackSource` interface with capabilities (`rawAudio`, `canDownloadForAlignment`)
- [x] YouTube source via `yt-dlp` tool manager in Rust:
  - [x] First-run consent enforcement
  - [x] Official release download + SHA256 checksum verification (`F:\vbcode\tools\yt-dlp.exe`)
  - [x] Embedded challenge solver + JS runtime evaluation (QuickJS-NG selected and verified, `0004-youtube-js-runtime-and-playback.md`)
  - [x] Auto-updater & diagnostics (startup check, error recovery, live status telemetry)
  - [x] Resolver with best-audio format selection (`ba/ba*`, Opus/WebM, AAC/M4A), 1-hour cache, friendly error mapping
  - [x] Loopback range-proxy (`127.0.0.1:<port>/stream?id=...&token=...`, CORS headers, chunked upstream requests, zero persistent files)
  - [x] Search (`ytsearchN:`) with music filtering, title cleaner, flat-playlist extraction
  - [x] Home shelves ("Trending", "Lo-Fi Beats") via `get_home_shelves` Tauri command
  - [x] Official YouTube IFrame Player API fallback mode (no effects)
- [x] Audius official API integration (track search, trending, streaming URL with artist attribution links)
- [x] Jamendo official API integration (client ID, Creative Commons badges, non-commercial attribution)
- [x] Internet Archive open-license provider (optional, default OFF, filtered to CC/PD audio)
- [x] Discover page with source tabs (YouTube | Audius | Jamendo | Archive) & unified search with source badges

---

## Phase 3: Lyrics Core & Sync Engine
- [x] `@myujiku/shared` parsers: standard LRC, Enhanced LRC (mid-word tags, A2 form, CRLF/BOM, out-of-order markers), plain text
- [x] Derived character-weighted word timing fallback with punctuation weighting
- [x] Enhanced LRC writer (round-trip verified)
- [x] Providers: LRCLIB API client with duration tolerance & ranking, sidecar `.lrc`/`.elrc` reader, embedded tags, local cache
- [x] "Find on Lyricsify" browser helper (no scraping, native shell link)
- [x] Live sync engine: `requestAnimationFrame` clock reader, linear transform (`lyricTime = speed * t + offset`)
- [x] Speed slider (tiny, translucent, log scale 0.5x-2x, double-click reset)
- [x] Offset control, tap-to-sync, "Shift lyrics by N s", duration-mismatch warning banner, keyboard nudge (`[` and `]`)
- [x] Auto-scroll with 4s pause after manual scroll
- [x] Add/Edit lyrics dialog (`EditLyricsModal` with live syntax check, ALL-CAPS fix preserving lexicon proper nouns)
- [x] Manual "Wrong lyrics?" search and pick dialog (`WrongLyricsModal`)
- [x] Floating mini-lyrics widget (`MiniLyricsHud`, draggable anywhere on desktop)

---

## Phase 4: Aligner Backend (`services/aligner`) & Desktop Integration
- [x] Python 3.11+ FastAPI service with CLI (`aligner align song.mp3 song.lrc -o song.elrc`)
- [x] Alignment evaluation spike: `stable-ts` vs `WhisperX` documented in `docs/aligner.md`
- [x] Window-constrained alignment algorithm (line timestamps as boundaries to prevent drift)
- [x] Syllable-split token merging, punctuation, apostrophes, chorus repetition, instrumental gaps (> 4s gaps get instrumental marker)
- [x] Confidence scoring per word and per line; fallback to derived timing for low confidence
- [x] Enhanced LRC output text + structured JSON with word confidences and fallback flags
- [x] HTTP API: `/health`, `/v1/models`, `/v1/align` (multipart), `/v1/jobs/{id}`, `/v1/derive`
- [x] Auth token for local sidecar (`X-MyuJiku-Sidecar-Token`), SQLite caching by SHA-256 hash
- [x] Aligner sidecar manager in Rust (`AlignerManager` with health check, start/stop, token generation)
- [x] Desktop UI integration: "Word-synced (aligned)" badge in Capsule, "Align to words" button in Deck, export `.elrc`
- [x] YouTube alignment strictly local-only policy enforced in `AlignerClient.ts`

---

## Phase 5: Lyric Styles & Visual Customization
- [ ] 10 Visual Styles:
  - [ ] Classic (spring scrolling, active word highlight)
  - [ ] Visual (inline icons and imagery)
  - [ ] Constellation (continuous chain, fading nodes, zoomed-out camera)
  - [ ] Ship (3D fly-through, legible active words)
  - [ ] Camera (kinetic typography, subtle/cinematic camera)
  - [ ] Fisheye (true spherical lens distortion shader)
  - [ ] Inverted Fisheye (pinch/liquid-warp, neon gradient, grain)
  - [ ] Codestyle (syntax highlighting, terminal line numbers)
  - [ ] Branches (generative organic tree growth)
  - [ ] Web (force-directed interconnected semantic graph)
- [ ] Shared camera system (Off / Subtle / Cinematic, zoom slider 50-200%)
- [ ] Color systems: Auto-Sync palette from cover art (OKLCH), manual pickers, Chroma cycling mode
- [ ] Edge glow: 11 styles, music sync via AnalyserNode
- [ ] Backgrounds: AMOLED black, cover art, blurred cover, custom video/image, palette gradient
- [ ] Overlays: raindrops, rain, snow, dust, embers, fireflies, stars, grain, scratches, scanlines, light leaks, bokeh
- [ ] Text effects: glow, neon outline, distressed, glitch, chromatic aberration
- [ ] Word images & effects: 2,000+ concept lexicon, 50 emoji pairs, 49 particle effects with flash-safety budget

---

## Phase 6: Accounts, Listen Together & Discord Presence
- [ ] Supabase Auth: Discord OAuth & Email/Password with PKCE flow & `myujiku://` deep link
- [ ] Listen Together rooms: 6-char code, share link, shared queue, skip voting, chat & reactions
- [ ] P2P drift-correction clock sync (resolving audio independently on each client; no audio relayed)
- [ ] Discord Rich Presence: native Rust Discord RPC, "Listening to MyuJiku", artwork, progress timestamps, privacy toggle
- [ ] "Now Playing" webhook and "Copy custom status"

---

## Phase 7: Desktop Polish, Docs & Installer
- [ ] Accessible keyboard navigation, ARIA labels, focus rings, high-contrast theme, UI scale 80-150%
- [ ] Performance audit: cold start < 2s, idle CPU < 2% with static stage
- [ ] Crash-safe logging with log viewer
- [ ] Documentation: `docs/youtube-source.md`, `docs/desktop.md`, `docs/aligner.md`, `docs/parity-matrix.md`, package READMEs
- [ ] NSIS Windows desktop installer bundled with UI
- [ ] Parity matrix verification report
