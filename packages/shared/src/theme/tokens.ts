import {
  ThemeMode,
  ThemeSettings,
  OklchColor,
  PalettePreset,
  CornerStyle,
  DensityStyle,
} from '../types';

/**
 * 8+ Curated Color Palettes defined in OKLCH space
 */
export const CURATED_PALETTES: PalettePreset[] = [
  {
    id: 'origami_violet',
    name: 'Origami Violet',
    accent: { l: 0.65, c: 0.22, h: 295 },
    description: 'Electric low-poly violet inspired by the MyuJiku crest',
  },
  {
    id: 'neon_cyan',
    name: 'Cyber Cyan',
    accent: { l: 0.75, c: 0.17, h: 210 },
    description: 'Vivid futuristic teal with high readability',
  },
  {
    id: 'amber_glow',
    name: 'Amber Fire',
    accent: { l: 0.72, c: 0.19, h: 55 },
    description: 'Warm glowing amber with soothing stage illumination',
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    accent: { l: 0.68, c: 0.23, h: 32 },
    description: 'Intense sunset crimson and radiant energy',
  },
  {
    id: 'emerald_forest',
    name: 'Emerald Matrix',
    accent: { l: 0.70, c: 0.18, h: 155 },
    description: 'Lush natural jade green with crisp presence',
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    accent: { l: 0.74, c: 0.19, h: 350 },
    description: 'Subtle neon magenta with modern elegance',
  },
  {
    id: 'arctic_blue',
    name: 'Arctic Glacier',
    accent: { l: 0.78, c: 0.14, h: 235 },
    description: 'Clean crystalline blue for focused listening',
  },
  {
    id: 'tokyo_night',
    name: 'Tokyo Night',
    accent: { l: 0.62, c: 0.24, h: 270 },
    description: 'Deep indigo and neon violet midnight aesthetics',
  },
];

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'amoled',
  accentHue: 295,
  accentChroma: 0.22,
  accentLightness: 0.65,
  followCoverArt: true,
  highContrast: false,
  cornerStyle: 'chamfer',
  density: 'comfortable',
  uiScale: 100,
  uiFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  lyricFont: 'inter',
  glassSurfaces: true,
  blurLevel: 16,
  motionLevel: 'full',
  animationSpeed: 1.0,
};

/**
 * Format OKLCH values into standard CSS color string
 */
export function formatOklch(color: OklchColor, alpha = 1.0): string {
  const l = (color.l * 100).toFixed(1);
  const c = color.c.toFixed(3);
  const h = color.h.toFixed(1);
  return alpha < 1.0
    ? `oklch(${l}% ${c} ${h} / ${alpha.toFixed(2)})`
    : `oklch(${l}% ${c} ${h})`;
}

/**
 * Approximate sRGB luminance from OKLCH lightness (L) for WCAG contrast ratio calculations.
 * OKLCH lightness corresponds very closely to the cubic root of relative luminance.
 */
export function oklchLuminance(l: number): number {
  if (l <= 0.08) return (l / 9.033);
  return Math.pow((l + 0.16) / 1.16, 3);
}

/**
 * Compute WCAG contrast ratio between two luminance values (1.0 to 21.0)
 */
export function getContrastRatio(l1: number, l2: number): number {
  const lum1 = oklchLuminance(l1);
  const lum2 = oklchLuminance(l2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Ensure color has minimum contrast against target background lightness.
 * Automatically adjusts lightness in OKLCH space until contrast threshold is satisfied.
 */
export function ensureContrast(
  color: OklchColor,
  bgLightness: number,
  targetRatio = 4.5
): OklchColor {
  let adjustedL = color.l;
  const isDarkBg = bgLightness < 0.5;

  let currentRatio = getContrastRatio(adjustedL, bgLightness);
  if (currentRatio >= targetRatio) {
    return color;
  }

  // Iteratively step lightness towards compliance
  for (let step = 0; step < 30; step++) {
    if (isDarkBg) {
      adjustedL = Math.min(0.98, adjustedL + 0.02);
    } else {
      adjustedL = Math.max(0.05, adjustedL - 0.02);
    }
    currentRatio = getContrastRatio(adjustedL, bgLightness);
    if (currentRatio >= targetRatio) break;
  }

  return {
    ...color,
    l: adjustedL,
  };
}

/**
 * Generate complete CSS variables from theme settings
 */
export function generateCssVariables(
  theme: ThemeSettings,
  dynamicAccent?: OklchColor
): Record<string, string> {
  const isDark = theme.mode === 'dark' || theme.mode === 'amoled' || (theme.mode === 'system' && true);
  const isAmoled = theme.mode === 'amoled';

  // Base lightness values
  const bgL = isAmoled ? 0.0 : isDark ? 0.08 : 0.98;
  const surfaceL = isAmoled ? 0.05 : isDark ? 0.12 : 0.94;
  const elevatedL = isAmoled ? 0.09 : isDark ? 0.16 : 0.90;
  const borderL = isAmoled ? 0.18 : isDark ? 0.22 : 0.82;
  const textL = isDark ? 0.96 : 0.10;
  const textMutedL = isDark ? 0.65 : 0.45;

  // Base accent
  let baseAccent: OklchColor = dynamicAccent || {
    l: theme.accentLightness,
    c: theme.accentChroma,
    h: theme.accentHue,
  };

  // Enforce contrast
  const minRatio = theme.highContrast ? 7.0 : 4.5;
  baseAccent = ensureContrast(baseAccent, bgL, minRatio);

  const hoverAccent: OklchColor = {
    ...baseAccent,
    l: Math.min(0.98, baseAccent.l + 0.08),
  };

  const activeAccent: OklchColor = {
    ...baseAccent,
    l: Math.max(0.1, baseAccent.l - 0.08),
  };

  // Corner radius / chamfer
  let chamferRadius = '8px';
  let chamferClip = 'polygon(0 0, 100% 0, 100% 100%, 0 100%)';
  if (theme.cornerStyle === 'chamfer') {
    chamferRadius = '0px';
    chamferClip = 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)';
  } else if (theme.cornerStyle === 'sharp') {
    chamferRadius = '0px';
    chamferClip = 'none';
  } else {
    chamferRadius = '16px';
    chamferClip = 'none';
  }

  // Density spacing multiplier
  const densityMultiplier = theme.density === 'compact' ? 0.75 : theme.density === 'spacious' ? 1.25 : 1.0;

  const vars: Record<string, string> = {
    '--color-bg-base': isAmoled ? '#000000' : formatOklch({ l: bgL, c: 0.005, h: 260 }),
    '--color-bg-surface': formatOklch({ l: surfaceL, c: 0.01, h: 260 }, theme.glassSurfaces ? 0.75 : 1.0),
    '--color-bg-elevated': formatOklch({ l: elevatedL, c: 0.015, h: 260 }, theme.glassSurfaces ? 0.85 : 1.0),
    '--color-border-base': formatOklch({ l: borderL, c: 0.01, h: 260 }),
    '--color-border-subtle': formatOklch({ l: borderL, c: 0.008, h: 260 }, 0.4),
    '--color-text-primary': formatOklch({ l: textL, c: 0.005, h: 260 }),
    '--color-text-secondary': formatOklch({ l: textMutedL + (isDark ? 0.15 : -0.15), c: 0.01, h: 260 }),
    '--color-text-muted': formatOklch({ l: textMutedL, c: 0.01, h: 260 }),
    '--color-accent': formatOklch(baseAccent),
    '--color-accent-hover': formatOklch(hoverAccent),
    '--color-accent-active': formatOklch(activeAccent),
    '--color-accent-glow': formatOklch(baseAccent, 0.4),
    '--color-lyric-active': formatOklch({ l: 0.99, c: 0.01, h: 260 }),
    '--color-lyric-inactive': formatOklch({ l: isDark ? 0.45 : 0.55, c: 0.01, h: 260 }),
    '--color-lyric-highlight': formatOklch(baseAccent),
    '--radius-base': chamferRadius,
    '--clip-chamfer': chamferClip,
    '--spacing-density': `${densityMultiplier}`,
    '--ui-scale': `${(theme.uiScale / 100).toFixed(2)}`,
    '--blur-surface': theme.glassSurfaces ? `${theme.blurLevel}px` : '0px',
    '--anim-speed': `${theme.animationSpeed}s`,
    '--font-ui': theme.uiFont,
  };

  // Add any custom CSS variable overrides
  if (theme.customCssVariables) {
    Object.assign(vars, theme.customCssVariables);
  }

  return vars;
}

/**
 * Apply CSS variables directly to DOM root (client-side)
 */
export function applyThemeToDom(vars: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

/**
 * Export theme as serialized JSON
 */
export function exportThemeJson(theme: ThemeSettings): string {
  return JSON.stringify(theme, null, 2);
}

/**
 * Import theme from JSON with validation
 */
export function importThemeJson(jsonString: string): ThemeSettings {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid theme JSON structure');
  }
  return {
    ...DEFAULT_THEME_SETTINGS,
    ...parsed,
  };
}

/**
 * Export compact shareable theme code (Base64 URL-safe)
 */
export function encodeThemeCode(theme: ThemeSettings): string {
  const payload = [
    theme.mode[0], // l, d, a, s
    Math.round(theme.accentHue),
    Math.round(theme.accentChroma * 100),
    Math.round(theme.accentLightness * 100),
    theme.cornerStyle[0], // s, c, o
    theme.density[0], // c, o, s
    theme.uiScale,
    theme.glassSurfaces ? 1 : 0,
  ].join(':');

  if (typeof btoa !== 'undefined') {
    return `MYU-${btoa(payload).replace(/=/g, '')}`;
  }
  return `MYU-${Buffer.from(payload).toString('base64').replace(/=/g, '')}`;
}

/**
 * Decode compact shareable theme code
 */
export function decodeThemeCode(code: string): Partial<ThemeSettings> {
  const clean = code.replace(/^MYU-/, '');
  const decoded = typeof atob !== 'undefined'
    ? atob(clean)
    : Buffer.from(clean, 'base64').toString('utf-8');

  const [modeChar, h, c, l, cornerChar, densityChar, scale, glass] = decoded.split(':');
  const modeMap: Record<string, ThemeMode> = { l: 'light', d: 'dark', a: 'amoled', s: 'system' };
  const cornerMap: Record<string, CornerStyle> = { s: 'sharp', c: 'chamfer', o: 'soft' };
  const densityMap: Record<string, DensityStyle> = { c: 'compact', o: 'comfortable', s: 'spacious' };

  return {
    mode: modeMap[modeChar] || 'amoled',
    accentHue: parseInt(h, 10) || 295,
    accentChroma: (parseInt(c, 10) || 22) / 100,
    accentLightness: (parseInt(l, 10) || 65) / 100,
    cornerStyle: cornerMap[cornerChar] || 'chamfer',
    density: densityMap[densityChar] || 'comfortable',
    uiScale: parseInt(scale, 10) || 100,
    glassSurfaces: glass === '1',
  };
}
