# MyuJiku v2 — Progress & Implementation Checklist

This checklist tracks the implementation status of all features and components across all phases of the project.

**Current Phase:** Phase 0 COMPLETED. Transitioning to Phase 1 (Audio Engine & Local Library).

---

## Phase 0: Foundation
- [x] Workspace & Monorepo initialization (pnpm workspaces, strict TypeScript, base configs)
- [x] CI workflow configuration (`.github/workflows/ci.yml`)
- [x] Legacy Feature Inventory (`docs/legacy-feature-inventory.md` mapping EVERY legacy feature)
- [x] Architectural Decision Records (`docs/decisions/0001-architecture-and-monorepo.md`, `0002-theme-tokens-and-design-system.md`, `0003-desktop-shell-stage-dock-capsule-deck.md`)
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
- [ ] Modular Web Audio API engine (Gain, Master, AnalyserNode)
- [ ] Effects chain: 8D Audio (spherical panner oscillator), Muffled (biquad low-pass), Vinyl / Dual Vinyl crackle & scratch simulation
- [ ] Ambient sound mixer with 10 bundled soundscapes (rain, thunder, birds, fireplace, crickets, etc.)
- [ ] Playback core: play, pause, seek, +/-5s skips, volume, loop (off/all/one), shuffle, gapless buffering
- [ ] Queue management (reorder, remove, clear, history)
- [ ] Rust Local Library scanner: recursive folder scan, file watcher, `lofty` metadata extraction (ID3, FLAC, Vorbis)
- [ ] Local SQLite database for library, playlists, likes, play history
- [ ] Drag-and-drop audio & lyric file import ("Upload custom audio" parity)
- [ ] Mini-player window mode
- [ ] Media keys and Windows system media transport controls (SMTC)

---

## Phase 2: Multi-Source Architecture (YouTube, Audius, Jamendo, Archive)
- [ ] Provider architecture: `TrackSource` interface with capabilities (`rawAudio`, `canDownloadForAlignment`)
- [ ] YouTube source via `yt-dlp` tool manager in Rust:
  - [ ] First-run consent enforcement
  - [ ] Official release download + SHA256 checksum verification (stored under app data / tools)
  - [ ] Embedded challenge solver + JS runtime evaluation (QuickJS-NG vs Deno spike)
  - [ ] Auto-updater (startup check, 12h interval, recovery on 403 / tool break)
  - [ ] Resolver with best-audio format selection, 1-hour cache, friendly error mapping
  - [ ] Loopback range-proxy vs progressive temp cache spike and implementation (ephemeral OS temp, capped at 500 MB LRU, wiped on exit/startup, NO export)
  - [ ] Search (`ytsearchN:`) with music filtering, title cleaner, pagination
  - [ ] Home shelves ("Trending", "New releases")
  - [ ] Official YouTube IFrame Player API fallback mode (no effects)
- [ ] Audius official API integration (track search, streaming proxy for raw audio, attribution links)
- [ ] Jamendo official API integration (client ID, Creative Commons badges, attribution)
- [ ] Internet Archive open-license provider (default OFF)
- [ ] Discover page with source tabs & unified search with source badges

---

## Phase 3: Lyrics Core & Sync Engine
- [ ] `@myujiku/shared` parsers: standard LRC, Enhanced LRC (mid-word tags, A2 form, CRLF/BOM, out-of-order markers), plain text
- [ ] Derived character-weighted word timing fallback
- [ ] Enhanced LRC writer (round-trip verified)
- [ ] Providers: LRCLIB API client with duration tolerance & ranking, sidecar `.lrc`/`.elrc` reader, embedded tags, local cache
- [ ] "Find on Lyricsify" browser helper (no scraping)
- [ ] Live sync engine: `requestAnimationFrame` clock reader, linear transform (`lyricTime = speed * t + offset`)
- [ ] Speed slider (tiny, translucent, log scale 0.5x-2x, double-click reset)
- [ ] Offset control, tap-to-sync, "Shift lyrics by N s", duration-mismatch warning banner
- [ ] Auto-scroll with 4s pause after manual scroll
- [ ] Add/Edit lyrics dialog (paste, upload, format detection, ALL-CAPS fix toggle)
- [ ] Floating mini-lyrics widget

---

## Phase 4: Aligner Backend (`services/aligner`) & Desktop Integration
- [ ] Python 3.11+ FastAPI service with CLI
- [ ] Alignment evaluation spike: `stable-ts` vs `WhisperX`
- [ ] Window-constrained alignment algorithm (line timestamps as boundaries to prevent drift)
- [ ] Syllable-split token merging, punctuation, apostrophes, chorus repetition, instrumental gaps
- [ ] Confidence scoring per word and per line; fallback to derived timing for low confidence
- [ ] Enhanced LRC output text + JSON structure
- [ ] HTTP API: `/health`, `/v1/models`, `/v1/align`, `/v1/jobs/{id}`, `/v1/derive`
- [ ] Auth token for local sidecar, caching by audio+lyrics hash
- [ ] Prebuilt sidecar bundle manager in Rust (download on demand, verify checksum, managed process)
- [ ] Desktop UI integration: "Word-synced (aligned)" badge, auto-align toggle, re-align, revert, export `.elrc`
- [ ] YouTube alignment strictly local-only (never upload YouTube audio remotely)

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
