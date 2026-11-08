# YouTube Source Architecture & Operational Guide

## Overview
MyuJiku v2 provides an optional local-only YouTube music source powered by `yt-dlp`. It runs exclusively on the user's desktop computer without any intermediate proxy servers, scraper backends, or third-party extraction services (such as Invidious or Piped).

---

## 1. Compliance, Legal & Terms-of-Service Risk

### User Responsibility & Consent
- **Opt-In Only**: YouTube playback is **disabled by default**. Upon first launch or navigating to YouTube-backed content, a prominent consent modal is displayed.
- **TOS Notification**: The modal explicitly informs the user that retrieving streams through third-party extractors may conflict with YouTube's Terms of Service and API policies.
- **Revocation & Kill Switch**: Users can revoke consent or disable the YouTube provider at any time in **Settings > Sources > YouTube**. When disabled, all YouTube searches and resolution calls are immediately deactivated.
- **No Persistence / No Exporting**: Under no circumstances does MyuJiku provide a download, save, or export function for YouTube audio. Streams are served purely ephemerally in RAM or in an auto-wiping OS temp cache capped at 500 MB (LRU), wiped completely on startup and exit.

---

## 2. Tool Manager & Runtime Architecture

### Binaries Managed
1. **yt-dlp**: Downloaded directly from the official GitHub release repository (`https://github.com/yt-dlp/yt-dlp/releases`).
2. **QuickJS-NG (`qjs.exe`)**: A lightweight (~1.87 MB) ES2023 JavaScript engine passed to `yt-dlp` via `--js-runtimes quickjs:...` to solve JavaScript challenges and n-sig deobfuscations without requiring heavyweight runtimes.

### Verification & Atomic Swapping
- Before executing any newly downloaded binary, the SHA2-256 hash is computed and validated against the official published `SHA2-256SUMS` file.
- Updates are written to a `.tmp` file and atomically renamed to prevent file corruption during mid-flight downloads or crashes.
- If a downloaded update fails a smoke test (`yt-dlp --version`), the system automatically rolls back to the prior known-good binary.

### Auto-Update Cadence
- **Startup Check**: Checks GitHub API for updates on app launch.
- **Periodic Check**: Runs every 12 hours while the app is active.
- **Reactive Recovery Check**: Immediately triggers an update check when a playback resolution fails with typical YouTube signature rotation errors (HTTP 403, `Sign in to confirm you're not a bot`, or signature decrypt errors).

---

## 3. Resolver & Playback Flow

### Resolving Audio
1. **Format Selection**: Best audio quality stream is selected (`ba/ba*`, prioritizing Opus/WebM, falling back to AAC/M4A).
2. **Caching**: Resolved streaming URLs are cached for 1 hour in memory keyed by video ID.
3. **Throttling & Concurrency**: Maximum 2 concurrent resolutions with 10-second timeouts.

### Loopback Range-Proxy (`127.0.0.1:<random-port>`)
- To feed audio into the browser's Web Audio API (`AudioContext`), standard CORS restrictions require valid headers. Direct YouTube CDN links do not permit arbitrary webview origins.
- The Rust backend starts a private loopback HTTP proxy listening on `127.0.0.1` on a dynamic port with an ephemeral cryptographic session token.
- The webview requests `http://127.0.0.1:<port>/stream?id=<video_id>&token=<session_token>`.
- The proxy issues upstream Range requests to the CDN, forwards audio byte chunks to the HTML5 audio element, and injects permissive CORS headers (`Access-Control-Allow-Origin: *`).
- This allows full Web Audio effect processing (8D panning, muffled filter, vinyl noise, live spectrum analysis) with zero disk footprint.

---

## 4. Official YouTube Embed Fallback

If `yt-dlp` is unavailable, disabled, outdated, or encountering regional/bot barriers, MyuJiku automatically offers an official fallback mode:
- **Player**: Embedded official YouTube IFrame Player API (`www.youtube.com/iframe_api`).
- **Effects Limitation**: Web Audio API DSP effects (8D, muffled filter, vinyl) are disabled because iframe audio cannot be routed through Web Audio nodes.
- **Lyrics Synchronization**: The lyric clock synchronizes directly with the iframe player's `getCurrentTime()` polling loop.

---

## 5. Diagnostic Tools

Users and developers can inspect the YouTube provider health at any time:
- **Inspect Modal**: Tap the MyuJiku logo 7 times or press `Ctrl+K > Inspect Provider Diagnostics`.
- **Diagnostics Reported**:
  - `yt-dlp` version and channel (stable/nightly)
  - JS runtime detected and executable path
  - Loopback proxy port and active streaming sessions
  - Cache utilization (MB / 500 MB limit)
  - Last error code and timestamp
  - "Test Video Resolution" action button to verify connectivity

