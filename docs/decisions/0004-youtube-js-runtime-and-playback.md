# Decision Record 0004: YouTube JS Runtime and Playback Architecture

## Context
MyuJiku v2 supports YouTube as a primary search and playback source via `yt-dlp`. YouTube frequently obfuscates player signatures (n-sig, deobfuscation challenges) which requires executing JavaScript code extracted from YouTube's player scripts. Additionally, streaming audio directly into the Web Audio API requires handling CORS headers, byte-range seeking, and stream URL expiration without violating YouTube's ephemeral playback constraints (no saving/exporting audio to disk).

## Evaluation: JavaScript Runtime (QuickJS-NG vs Deno)
yt-dlp supports passing external JavaScript runtimes via `--js-runtimes <runtime>:<path>`.

| Criteria | QuickJS-NG (`qjs.exe`) | Deno (`deno.exe`) |
| :--- | :--- | :--- |
| **Binary Size** | **~1.87 MB** | ~150 MB uncompressed (>70 MB zip) |
| **Startup Latency** | **< 5 ms** | ~40–60 ms (V8 engine initialization) |
| **Memory Footprint** | **~3–5 MB** | ~35–50 MB |
| **Sandboxing** | Safe ES2023 interpreter, no ambient host access | Rich runtime, unnecessary features for JS challenges |
| **yt-dlp Support** | First-class native support (`--js-runtimes quickjs:...`) | Native support |

### Decision: QuickJS-NG
We adopt **QuickJS-NG** (`qjs-windows-x86_64.exe`):
1. Downloads in < 2 seconds (< 2 MB).
2. Verifies against published SHA256 hashes.
3. Provides sub-5ms challenge evaluation for `yt-dlp`.
4. Saved in the local tools directory (`F:\vbcode\tools` in dev, `%APPDATA%\MyuJiku\tools` in production).

---

## Evaluation: Playback Architecture (Loopback Range-Proxy vs Progressive Temp Cache)

### Option A: Rust Loopback Range-Proxy (`http://127.0.0.1:<port>/stream`)
- **Mechanism**: A lightweight local Axum/Hyper or tiny HTTP server in Rust on `127.0.0.1` with a random OS-assigned port and per-session cryptographic authentication token.
- **Range Handling**: Handles standard HTTP `Range: bytes=start-end` requests from the HTML5 `<audio>` element, proxies chunked requests upstream to YouTube googlevideo CDN, and returns byte ranges.
- **CORS Support**: Sets `Access-Control-Allow-Origin: *`, allowing the browser's `AudioContext.createMediaElementSource` to process audio through the full effects chain (8D, muffled, vinyl crackle, EQ, AnalyserNode) without CORS tainting.
- **No Disk Storage**: Raw audio streams directly through memory in ephemeral chunks; no audio bytes are ever stored on disk.
- **Mid-Stream Expiration Handling**: YouTube video stream URLs expire after ~6 hours or switch CDN nodes causing HTTP 403. The loopback proxy intercepts upstream 403 errors, re-resolves the video stream via `yt-dlp` transparently, and resumes the stream from the current byte offset without user disruption.

### Option B: Progressive Download to Temp Cache
- **Mechanism**: Downloads chunks into an ephemeral OS temp folder (`%TEMP%\myujiku-cache`), capped at 500 MB LRU, served through Tauri's custom asset protocol.
- **Drawbacks**: Adds initial playback latency (especially on slower networks), introduces complex file locking across seeks, causes heavy disk write churn, and risks leaving files behind on ungraceful OS termination.

### Decision: Primary Loopback Range-Proxy with Fallback
We implement **Option A (Rust Loopback Range-Proxy)** as the primary playback engine:
- **Instant playback start** (sub-200ms TTFB).
- **Instant seeking** across the entire track via HTTP Range headers.
- **100% Web Audio API compatibility** with raw audio effects and frequency analyser.
- **Zero persistent audio footprints** satisfying the non-persistence security model.
- **Automatic token rotation and loopback isolation** preventing unauthorized local processes from relaying streams.

