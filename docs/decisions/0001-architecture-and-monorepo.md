# ADR 0001: Monorepo Architecture & Technology Stack

## Context
MyuJiku v2 is a complete rebuild of the previous Next.js/Electron web application into a high-performance Windows desktop application centered around word-synced lyrics and rich audio effects.

The legacy app suffered from:
1. High memory footprint and latency from Electron and Next.js server abstractions.
2. Tight coupling of UI, audio playback, and lyric parsing logic.
3. Limited native desktop integration (file system watching, media keys, audio loopback).
4. No clean separation for heavy ML forced-alignment workloads.

## Decisions

### 1. Monorepo Organization (pnpm Workspaces)
We adopt a monorepo structured into:
- `apps/desktop`: Tauri 2 (Rust backend) + React 19 + Vite SPA frontend.
- `packages/shared`: Framework-free TypeScript library containing LRC/Enhanced-LRC parsers, word timing math, title normalizers, lexicon dictionary, and OKLCH theme token calculations.
- `services/aligner`: Standalone Python 3.11+ FastAPI service wrapping Whisper/stable-ts forced-alignment for on-demand execution.
- `docs/`: Comprehensive technical documentation, architecture decisions, and parity tracking.

### 2. Tauri 2 + Rust for Desktop Backend
Tauri 2 provides:
- Native Windows performance with minimal idle memory usage (~30-50 MB vs 300+ MB in Electron).
- Direct access to Windows APIs via Rust: high-throughput audio stream proxy, file system notifications, SQLite local database, media keys, and Discord IPC.
- High security: fine-grained permission capabilities and strict origin isolation.

### 3. Framework-Free `@myujiku/shared`
By isolating all parsing, sync math, and styling calculations into a standalone package with zero DOM or React dependencies, we guarantee:
- 100% test coverage with sub-second Vitest test suites.
- Code reuse across the desktop app, future sidecars, or CLI utilities.

## Consequences
- Requires Rust MSVC toolchain (configured at `F:\vbcode\rust`).
- Audio files are decoded and processed in the webview via Web Audio API, while stream routing and metadata extraction are managed by Rust.

