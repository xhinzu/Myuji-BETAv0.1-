import { describe, it, expect } from 'vitest';
import { ENGLISH_LEXICON, getLexiconForLocale } from '../src/lexicon';
import { WORD_EFFECTS, EFFECT_BY_ID, getEffectIdForWord } from '../src/visuals/catalog';
import { generateVisualCueTimeline } from '../src/visuals/matcher';
import { SyncedLyricLine } from '../src/types';

describe('Lexicon & Visual Cue Matcher', () => {
  it('contains over 2,000 visual concepts in the English lexicon', () => {
    expect(ENGLISH_LEXICON.length).toBeGreaterThan(2000);
    const localeLexicon = getLexiconForLocale('en-US');
    expect(localeLexicon.length).toBe(ENGLISH_LEXICON.length);
  });

  it('contains all 49 word effects in the catalog', () => {
    expect(WORD_EFFECTS.length).toBe(49);
    expect(EFFECT_BY_ID.get('bomb')).toBeDefined();
    expect(EFFECT_BY_ID.get('fire')).toBeDefined();
    expect(EFFECT_BY_ID.get('rain')).toBeDefined();
    expect(EFFECT_BY_ID.get('love')).toBeDefined();
    expect(EFFECT_BY_ID.get('lightning')).toBeDefined();
    expect(EFFECT_BY_ID.get('glitch')).toBeDefined();
  });

  it('resolves words to specific visual effects', () => {
    expect(getEffectIdForWord('bomb')).toBe('bomb');
    expect(getEffectIdForWord('explosion!')).toBe('bomb');
    expect(getEffectIdForWord('burning')).toBe('fire');
    expect(getEffectIdForWord('storm')).toBe('rain');
  });

  it('generates a visual cue timeline with context cues and cooldowns', () => {
    const mockLines: SyncedLyricLine[] = [
      {
        id: 1,
        start: 0,
        end: 4,
        text: 'The fire burns into the night sky',
        words: [
          { text: 'The', start: 0, end: 0.5 },
          { text: 'fire', start: 0.5, end: 1.0 },
          { text: 'burns', start: 1.0, end: 1.8 },
          { text: 'into', start: 1.8, end: 2.2 },
          { text: 'the', start: 2.2, end: 2.5 },
          { text: 'night', start: 2.5, end: 3.2 },
          { text: 'sky', start: 3.2, end: 4.0 },
        ],
      },
    ];

    const timeline = generateVisualCueTimeline(mockLines, { enabled: true, frequency: 'normal' });
    expect(timeline.cues.length).toBeGreaterThan(0);

    // Stoplist words like 'the' and 'into' should not be cues
    for (const cue of timeline.cues) {
      expect(['the', 'into', 'and', 'or']).not.toContain(cue.wordText.toLowerCase());
    }
  });
});
