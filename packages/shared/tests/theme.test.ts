import { describe, it, expect } from 'vitest';
import {
  CURATED_PALETTES,
  DEFAULT_THEME_SETTINGS,
  formatOklch,
  getContrastRatio,
  ensureContrast,
  generateCssVariables,
  exportThemeJson,
  importThemeJson,
  encodeThemeCode,
  decodeThemeCode,
} from '../src/theme/tokens';
import { ThemeSettings } from '../src/types';

describe('Theme & OKLCH Design Tokens', () => {
  it('contains at least 8 curated palettes', () => {
    expect(CURATED_PALETTES.length).toBeGreaterThanOrEqual(8);
    for (const pal of CURATED_PALETTES) {
      expect(pal.id).toBeTruthy();
      expect(pal.accent.l).toBeGreaterThan(0);
      expect(pal.accent.c).toBeGreaterThan(0);
      expect(pal.accent.h).toBeGreaterThanOrEqual(0);
    }
  });

  it('formats OKLCH correctly with and without alpha', () => {
    const color = { l: 0.7, c: 0.2, h: 290 };
    expect(formatOklch(color)).toBe('oklch(70.0% 0.200 290.0)');
    expect(formatOklch(color, 0.5)).toBe('oklch(70.0% 0.200 290.0 / 0.50)');
  });

  it('computes WCAG contrast ratio accurately', () => {
    // Pure black (L=0) vs pure white (L=1) -> ~21:1
    const maxRatio = getContrastRatio(1.0, 0.0);
    expect(maxRatio).toBeGreaterThan(15);

    // Identical lightness -> 1:1
    const sameRatio = getContrastRatio(0.5, 0.5);
    expect(sameRatio).toBeCloseTo(1.0, 1);
  });

  it('automatically enforces contrast against dark and light backgrounds', () => {
    const lowContrastDark = { l: 0.15, c: 0.1, h: 200 };
    // Against black bg (L=0), low lightness gives low contrast. ensureContrast must boost L.
    const boosted = ensureContrast(lowContrastDark, 0.0, 4.5);
    expect(boosted.l).toBeGreaterThan(lowContrastDark.l);
    expect(getContrastRatio(boosted.l, 0.0)).toBeGreaterThanOrEqual(4.5);

    const lowContrastLight = { l: 0.85, c: 0.1, h: 200 };
    // Against white bg (L=1), high lightness gives low contrast. ensureContrast must decrease L.
    const lowered = ensureContrast(lowContrastLight, 1.0, 4.5);
    expect(lowered.l).toBeLessThan(lowContrastLight.l);
    expect(getContrastRatio(lowered.l, 1.0)).toBeGreaterThanOrEqual(4.5);
  });

  it('generates complete CSS variables for AMOLED, Dark, and Light themes', () => {
    const amoledVars = generateCssVariables({ ...DEFAULT_THEME_SETTINGS, mode: 'amoled' });
    expect(amoledVars['--color-bg-base']).toBe('#000000');
    expect(amoledVars['--clip-chamfer']).toContain('polygon');
    expect(amoledVars['--color-accent']).toBeTruthy();

    const lightVars = generateCssVariables({ ...DEFAULT_THEME_SETTINGS, mode: 'light' });
    expect(lightVars['--color-bg-base']).not.toBe('#000000');
    expect(lightVars['--color-accent']).toBeTruthy();
  });

  it('exports and imports theme JSON correctly', () => {
    const custom: ThemeSettings = {
      ...DEFAULT_THEME_SETTINGS,
      accentHue: 180,
      uiScale: 110,
    };
    const json = exportThemeJson(custom);
    const parsed = importThemeJson(json);
    expect(parsed.accentHue).toBe(180);
    expect(parsed.uiScale).toBe(110);
  });

  it('encodes and decodes compact shareable theme codes', () => {
    const theme: ThemeSettings = {
      ...DEFAULT_THEME_SETTINGS,
      mode: 'dark',
      accentHue: 210,
      accentChroma: 0.18,
      accentLightness: 0.72,
      uiScale: 125,
    };
    const code = encodeThemeCode(theme);
    expect(code.startsWith('MYU-')).toBe(true);

    const decoded = decodeThemeCode(code);
    expect(decoded.mode).toBe('dark');
    expect(decoded.accentHue).toBe(210);
    expect(decoded.uiScale).toBe(125);
  });
});

