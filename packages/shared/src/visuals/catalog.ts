import { WordEffectDefinition } from '../types';

export const WORD_EFFECTS: WordEffectDefinition[] = [
  // Impact & Energy
  { id: 'bomb', name: 'Explosion / Bomb', category: 'impact', intensity: 'intense', flashWarning: true, defaultDurationMs: 1400 },
  { id: 'lightning', name: 'Lightning Strike', category: 'impact', intensity: 'intense', flashWarning: true, defaultDurationMs: 1000 },
  { id: 'scream', name: 'Shockwave Scream', category: 'impact', intensity: 'normal', defaultDurationMs: 900 },
  { id: 'crash', name: 'Vehicle / Heavy Crash', category: 'impact', intensity: 'intense', defaultDurationMs: 1200 },
  { id: 'shatter', name: 'Glass Shatter', category: 'impact', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'heartbeat', name: 'Heartbeat Pulse', category: 'impact', intensity: 'normal', defaultDurationMs: 1300 },

  // Fire, Heat & Light
  { id: 'fire', name: 'Blazing Fire', category: 'fire', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'sun', name: 'Sunbeam Burst', category: 'fire', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'star', name: 'Twinkling Star', category: 'fire', intensity: 'normal', defaultDurationMs: 1000 },
  { id: 'magic', name: 'Magic Sparkles', category: 'fire', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'candle', name: 'Flickering Candle', category: 'fire', intensity: 'normal', defaultDurationMs: 1400 },

  // Water, Weather & Sky
  { id: 'rain', name: 'Rain Shower', category: 'water', intensity: 'normal', defaultDurationMs: 1300 },
  { id: 'ocean', name: 'Ocean Wave', category: 'water', intensity: 'normal', defaultDurationMs: 1500 },
  { id: 'snow', name: 'Gentle Snowfall', category: 'water', intensity: 'normal', defaultDurationMs: 1600 },
  { id: 'wind', name: 'Gusting Wind', category: 'water', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'cloud', name: 'Drifting Clouds', category: 'water', intensity: 'normal', defaultDurationMs: 1400 },
  { id: 'moon', name: 'Moonlit Halo', category: 'water', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'rainbow', name: 'Rainbow Arc', category: 'water', intensity: 'normal', defaultDurationMs: 1500 },

  // Emotion & Relationships
  { id: 'love', name: 'Floating Hearts', category: 'emotion', intensity: 'normal', defaultDurationMs: 1400 },
  { id: 'heartbreak', name: 'Broken Heart', category: 'emotion', intensity: 'normal', defaultDurationMs: 1300 },
  { id: 'angel', name: 'Angel Wings', category: 'emotion', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'ghost', name: 'Phantom Ghost', category: 'emotion', intensity: 'normal', defaultDurationMs: 1300 },
  { id: 'dream', name: 'Dream Spiral', category: 'emotion', intensity: 'normal', defaultDurationMs: 1500 },
  { id: 'confetti', name: 'Celebration Confetti', category: 'emotion', intensity: 'normal', defaultDurationMs: 1600 },

  // Motion & Objects
  { id: 'speed', name: 'Speed Trails', category: 'motion', intensity: 'normal', defaultDurationMs: 900 },
  { id: 'fall', name: 'Downward Descent', category: 'motion', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'rise', name: 'Ascending Particles', category: 'motion', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'spin', name: 'Whirlwind Vortex', category: 'motion', intensity: 'normal', defaultDurationMs: 1000 },
  { id: 'dance', name: 'Dance Notes', category: 'motion', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'clock', name: 'Ticking Clock Hands', category: 'motion', intensity: 'normal', defaultDurationMs: 1300 },
  { id: 'echo', name: 'Echo Rings', category: 'motion', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'shadow', name: 'Creeping Shadow', category: 'motion', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'coins', name: 'Falling Coins', category: 'motion', intensity: 'normal', defaultDurationMs: 1400 },
  { id: 'phone', name: 'Ringing Phone Vibe', category: 'motion', intensity: 'normal', defaultDurationMs: 1000 },
  { id: 'glitch', name: 'Digital Glitch Slice', category: 'motion', intensity: 'intense', defaultDurationMs: 800 },
  { id: 'poison', name: 'Toxic Bubbles', category: 'motion', intensity: 'normal', defaultDurationMs: 1300 },
  { id: 'flower', name: 'Blooming Petals', category: 'motion', intensity: 'normal', defaultDurationMs: 1400 },
  { id: 'butterfly', name: 'Fluttering Wings', category: 'motion', intensity: 'normal', defaultDurationMs: 1500 },
  { id: 'chains', name: 'Rattling Chains', category: 'motion', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'mirror', name: 'Prismatic Mirror', category: 'motion', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'eye', name: 'All-Seeing Iris', category: 'motion', intensity: 'normal', defaultDurationMs: 1100 },
  { id: 'door', name: 'Creaking Portal', category: 'motion', intensity: 'normal', defaultDurationMs: 1200 },
  { id: 'drink', name: 'Effervescent Fizz', category: 'motion', intensity: 'normal', defaultDurationMs: 1300 },
  { id: 'music', name: 'Harmonic Staves', category: 'motion', intensity: 'normal', defaultDurationMs: 1200 },

  // Intense Effects (Dark / Combat)
  { id: 'gun', name: 'Muzzle Flash', category: 'intense', intensity: 'intense', flashWarning: true, defaultDurationMs: 900 },
  { id: 'knife', name: 'Blade Slash', category: 'intense', intensity: 'intense', defaultDurationMs: 800 },
  { id: 'blood', name: 'Crimson Drip', category: 'intense', intensity: 'intense', defaultDurationMs: 1200 },
  { id: 'skull', name: 'Spectral Skull', category: 'intense', intensity: 'intense', defaultDurationMs: 1300 },
  { id: 'war', name: 'Battlefield Sparks', category: 'intense', intensity: 'intense', flashWarning: true, defaultDurationMs: 1400 },
];

export const EFFECT_BY_ID = new Map<string, WordEffectDefinition>(
  WORD_EFFECTS.map((e) => [e.id, e])
);

export const WORD_TO_EFFECT_MAP: Record<string, string> = {
  bomb: 'bomb', explode: 'bomb', explosion: 'bomb', blast: 'bomb', dynamite: 'bomb',
  fire: 'fire', flame: 'fire', burn: 'fire', burning: 'fire', blaze: 'fire',
  rain: 'rain', raining: 'rain', storm: 'rain', pour: 'rain', drizzle: 'rain',
  lightning: 'lightning', thunder: 'lightning', bolt: 'lightning', electric: 'lightning',
  love: 'love', heart: 'love', kiss: 'love', adored: 'love', passionate: 'love',
  heartbreak: 'heartbreak', broken: 'heartbreak', shatter: 'shatter', crash: 'crash',
  snow: 'snow', ice: 'snow', cold: 'snow', winter: 'snow', freeze: 'snow',
  sun: 'sun', sunshine: 'sun', daylight: 'sun', dawn: 'sun',
  star: 'star', stars: 'star', starlight: 'star', galaxy: 'star',
  magic: 'magic', magical: 'magic', spell: 'magic', sparkle: 'magic',
  dance: 'dance', dancing: 'dance', party: 'confetti', celebrate: 'confetti',
  coins: 'coins', money: 'coins', cash: 'coins', gold: 'coins', dollar: 'coins',
  glitch: 'glitch', error: 'glitch', broken_code: 'glitch', matrix: 'glitch',
};

export function getEffectIdForWord(word: string): string | undefined {
  const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  return WORD_TO_EFFECT_MAP[clean];
}
