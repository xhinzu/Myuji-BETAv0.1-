import { describe, it, expect } from 'vitest';
import {
  parseEnhancedLrc,
  writeEnhancedLrc,
  deriveWordTiming,
  cleanTitleForLyrics,
  calculateLyricTime,
  fixAllCapsLrc,
  precomputeVisualTimeline,
} from '../src';

describe('Smoke Test: 10 Diverse Song Scenarios (YouTube, Audius, Jamendo, Local)', () => {
  const diverseTestSet = [
    {
      id: 'yt:dQw4w9WgXcQ',
      source: 'youtube',
      rawTitle: 'Rick Astley - Never Gonna Give You Up (Official Music Video) [4K]',
      artist: 'Rick Astley',
      duration: 213,
      sampleLrc: '[00:18.50]Never gonna give you up\n[00:22.10]Never gonna let you down',
    },
    {
      id: 'yt:jfKfPfyJRdk',
      source: 'youtube',
      rawTitle: 'lofi hip hop radio - beats to relax/study to // 24/7 lofi',
      artist: 'Lofi Girl',
      duration: 3600,
      sampleLrc: '[00:00.00]♪ Instrumental Lo-Fi Beat ♪',
    },
    {
      id: 'yt:kJQP7kiw5Fk',
      source: 'youtube',
      rawTitle: 'Luis Fonsi - Despacito ft. Daddy Yankee (Audio)',
      artist: 'Luis Fonsi',
      duration: 228,
      sampleLrc: '[00:15.30]Despacito\n[00:18.20]Quiero respirar tu cuello despacito',
    },
    {
      id: 'yt:fJ9rUzIMcZQ',
      source: 'youtube',
      rawTitle: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
      artist: 'Queen',
      duration: 355,
      sampleLrc: '[00:00.80]Is this the real life? Is this just fantasy?\n[00:09.10]Caught in a landslide, no escape from reality',
    },
    {
      id: 'yt:5qap5aO4i9A',
      source: 'youtube',
      rawTitle: 'CHILL Lofi Beats for Coding & Night Drives (Mix)',
      artist: 'Chill Beats Collective',
      duration: 1800,
      sampleLrc: '[00:00.00]♪ Instrumental Session ♪',
    },
    {
      id: 'audius:7dG3kP',
      source: 'audius',
      rawTitle: 'Starlight Odyssey (Original Mix)',
      artist: 'Cosmic Voyager',
      duration: 195,
      sampleLrc: '[00:12.00]Drifting through the cosmic sea\n[00:17.50]Starlight guiding you and me',
    },
    {
      id: 'audius:9xL2qM',
      source: 'audius',
      rawTitle: 'Neon Highway 1984',
      artist: 'Synthwave Knight',
      duration: 240,
      sampleLrc: '[00:20.00]Midnight drive on neon streets\n[00:25.00]Synthwave pulse in every heartbeat',
    },
    {
      id: 'jamendo:1884021',
      source: 'jamendo',
      rawTitle: 'Mountain Echoes',
      artist: 'Acoustic Traveler',
      duration: 182,
      sampleLrc: '[00:08.40]ECHOES ON THE MOUNTAIN SIDE\n[00:14.20]WHERE THE WILD HORSES RUN FREE',
    },
    {
      id: 'jamendo:1924510',
      source: 'jamendo',
      rawTitle: 'Moonlit Piano Sonata No. 4',
      artist: 'Clara Delacroix',
      duration: 310,
      sampleLrc: '[00:00.00]♪ Piano Solo ♪',
    },
    {
      id: 'local:C:/Music/test_track.mp3',
      source: 'local',
      rawTitle: 'Local Acoustic Jam Session 2026',
      artist: 'Bedroom Producer',
      duration: 145,
      sampleLrc: '[00:05.10]<00:05.10> Strumming <00:05.90> chords <00:06.50> in <00:06.80> the <00:07.10> afternoon\n[00:08.50]<00:08.50> Singing <00:09.30> songs <00:10.10> under <00:10.70> the <00:11.20> moon',
    },
  ];

  it('verifies 10 diverse tracks against normalizer, parser, derived timing & visual lexicon', () => {
    expect(diverseTestSet).toHaveLength(10);

    for (const track of diverseTestSet) {
      // 1. Verify Title Normalization
      const cleaned = cleanTitleForLyrics(track.rawTitle);
      expect(cleaned).toBeTruthy();
      expect(cleaned.length).toBeLessThanOrEqual(track.rawTitle.length);
      expect(cleaned).not.toContain('(Official Music Video)');
      expect(cleaned).not.toContain('[4K]');

      // 2. Parse LRC / Enhanced LRC
      const parsed = parseEnhancedLrc(track.sampleLrc);
      expect(parsed.lines.length).toBeGreaterThan(0);

      // 3. Sentence ALL CAPS fix
      const fixedLines = parsed.lines.map((l) => ({
        ...l,
        text: fixAllCapsLrc(l.text),
      }));
      expect(fixedLines.length).toBe(parsed.lines.length);

      // 4. Derive word-level timing if not already present
      const timedLines = fixedLines.map((line, idx) => {
        if (!line.words || line.words.length === 0) {
          const nextStart = fixedLines[idx + 1]?.start || line.start + 5.0;
          return {
            ...line,
            words: deriveWordTiming(line.text, line.start, nextStart),
          };
        }
        return line;
      });

      for (const line of timedLines) {
        expect(line.words.length).toBeGreaterThan(0);
        // Verify monotonicity
        for (let i = 0; i < line.words.length - 1; i++) {
          expect(line.words[i + 1].start).toBeGreaterThanOrEqual(line.words[i].start);
        }
      }

      // 5. Verify Linear Transform Math
      const transformedTime = calculateLyricTime(10.0, { speed: 1.05, offset: -0.2 });
      expect(transformedTime).toBeCloseTo(10.3, 1);

      // 6. Precompute Visual Cues from 2,000+ Concept Lexicon
      const timeline = precomputeVisualTimeline(timedLines, { frequency: 'normal' });
      expect(timeline).toBeDefined();
      expect(typeof timeline.getCue).toBe('function');

      // 7. Re-serialize to Enhanced LRC format
      const serialized = writeEnhancedLrc(timedLines);
      expect(serialized).toContain('[');
      expect(serialized.length).toBeGreaterThan(10);
    }
  });
});
