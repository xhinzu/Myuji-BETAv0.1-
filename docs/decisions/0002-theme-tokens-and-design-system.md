# ADR 0002: OKLCH Design Tokens and Theme Customization Engine

## Context
MyuJiku requires dynamic, accessible visual customization. The UI must support:
- Light, Dark, AMOLED Black, and System themes.
- Dynamic cover art color extraction with automatic WCAG contrast validation.
- 8+ curated color palettes.
- Customizable corner treatments (sharp, chamfered, soft), UI density, and UI scale (80% to 150%).
- Full theme import/export via JSON and shareable encoded strings.

## Decisions

### 1. OKLCH Color Space
We standardize on the **OKLCH** color model for all programmatic color manipulations:
- Perceptually uniform lightness ($L$): guarantees that switching hues does not alter apparent contrast or readability.
- Consistent chroma ($C$): enables natural saturation scaling without clipping or muddy tones.
- Easy hue rotation ($H$): provides mathematically sound color harmonies (complementary, analogous, triadic).

### 2. WCAG AA / AAA Contrast Enforcement
Every dynamic theme calculation runs through a contrast calculation against background luminances. If a derived accent or lyric highlight color falls below a 4.5:1 ratio (or 7:1 in high-contrast mode), lightness is automatically adjusted along the OKLCH lightness curve until compliant.

### 3. CSS Custom Properties with Instant Live Update
All tokens are declared as CSS variables (`--color-bg`, `--color-accent`, `--radius-chamfer`, etc.) applied directly to the document root element. No React state reloading or stylesheet recompilation is triggered when changing themes.

## Consequences
- Theme changes apply in a single frame.
- High contrast accessibility is guaranteed programmatically regardless of user palette choices or album artwork.
