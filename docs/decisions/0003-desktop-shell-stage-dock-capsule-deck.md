# ADR 0003: "Stage-First" Desktop Shell (Stage, Dock, Capsule, Deck)

## Context
Conventional music players (Spotify, Apple Music, YouTube Music) rely on a rigid dashboard layout:
- Left persistent library sidebar.
- Center scrolling square album cards.
- Right "Now Playing" or queue drawer.
- Full-width persistent bottom playback bar.

In MyuJiku, **the lyrics and sound visuals are the hero of the experience**. A standard 3-column dashboard clutters the screen, shrinks the visual canvas, and makes the app feel like a generic streaming client.

## Decisions

### 1. The Stage as the Primary Canvas
- The base window is the **Stage**: a full-bleed, living canvas rendering the active lyric style (Classic, Visual, Constellation, Ship, Camera, Fisheye, etc.) and atmospheric background.
- When idle, the Stage displays subtle ambient visual movement (particles, starfield, or dynamic gradients) rather than an empty static state.
- Floating chrome automatically fades out during uninterrupted playback after 3.5 seconds of user inactivity.

### 2. Floating Vertical Dock
- Navigation is consolidated into a compact floating pill on the left:
  - **Stage** (lyrics visualizer)
  - **Library** (local audio & saved collections)
  - **Discover** (YouTube, Audius, Jamendo, Archive)
  - **Mixer** (ambient soundscapes, 8D, muffled, dual vinyl)
  - **Rooms** (Listen Together peer sessions)
  - **Settings** (audio, themes, aligner, tool manager)
- Content views slide in as fluid sheets/drawers over the stage without destroying stage state or context.

### 3. Floating Capsule & Expandable Deck
- Playback controls sit in an anchored bottom-center **Capsule**:
  - Mini thumbnail, title/artist marquee, play/pause/skip buttons, and unobtrusive progress rail.
- Clicking or dragging the Capsule upward expands it into the **Deck**:
  - Full queue management.
  - Sub-millisecond lyric speed slider and offset calibration.
  - Quick audio effect toggles (8D, muffled, vinyl).
  - Source diagnostics.

### 4. Low-Poly Chamfered Visual Language
Echoing the origami / low-poly cat logo:
- UI surfaces feature chamfered corner cuts (`polygon(...)` clip-paths and angled borders).
- Distinctive faceted geometry sets MyuJiku apart from conventional rounded rectangles.

## Consequences
- Maximizes screen real estate for immersive lyrics animations.
- Provides immediate keyboard-driven access via Command Palette (`Ctrl+K`).
- Seamlessly scales down to compact desktop windows (~900x600) and dedicated Mini-Player mode.
