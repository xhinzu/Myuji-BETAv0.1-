import { describe, it, expect } from 'vitest';
import { parseEnhancedLrc } from '../src/lyrics/parseEnhancedLrc';
import { writeEnhancedLrc } from '../src/lyrics/writeEnhancedLrc';
import { parseLrc } from '../src/lyrics/parseLrc';
import { deriveWordTimingsFromLrc } from '../src/lyrics/wordTiming';

describe('Enhanced LRC Parser and Writer', () => {
  it('parses metadata tags accurately', () => {
    const lrc = `
[ar: The Weeknd]
[ti: Blinding Lights]
[al: After Hours]
[length: 03:20]
[offset: +500]
[00:10.00]First line of the song
    `.trim();

    const result = parseEnhancedLrc(lrc);
    expect(result.meta.artist).toBe('The Weeknd');
    expect(result.meta.title).toBe('Blinding Lights');
    expect(result.meta.album).toBe('After Hours');
    expect(result.meta.lengthSeconds).toBe(200);
    expect(result.meta.offsetMs).toBe(500);
    expect(result.format).toBe('lrc');
    expect(result.lines.length).toBe(1);
    // 10s + 0.5s offset = 10.5s
    expect(result.lines[0].start).toBe(10.5);
  });

  it('parses word-level timestamps in Enhanced-LRC format', () => {
    const elrc = `
[00:04.20]Yeah <00:04.60>I <00:04.85>been <00:05.10>tryin' <00:05.50>to <00:05.80>call
[00:07.10]I've <00:07.40>been <00:07.70>on <00:08.00>my <00:08.20>own
[00:10.50]
    `.trim();

    const result = parseEnhancedLrc(elrc);
    expect(result.format).toBe('enhanced');
    expect(result.synced).toBe('word');
    expect(result.lines.length).toBe(2);

    const line1 = result.lines[0];
    expect(line1.text).toBe("Yeah I been tryin' to call");
    expect(line1.words.length).toBe(6);
    expect(line1.words[0].text).toBe('Yeah');
    expect(line1.words[0].start).toBe(4.2);
    expect(line1.words[1].text).toBe('I');
    expect(line1.words[1].start).toBe(4.6);

    // End marker [00:10.50] should define line 2 end
    const line2 = result.lines[1];
    expect(line2.end).toBe(10.5);
  });

  it('parses repeated line timestamps correctly', () => {
    const lrc = `
[00:10.00][00:40.00]Chorus line repeated twice
    `.trim();

    const result = parseEnhancedLrc(lrc);
    expect(result.lines.length).toBe(2);
    expect(result.lines[0].start).toBe(10.0);
    expect(result.lines[1].start).toBe(40.0);
  });

  it('round-trips Enhanced LRC through writeEnhancedLrc and parseEnhancedLrc', () => {
    const originalElrc = `
[ar:Artist]
[ti:Title]
[00:02.00]Hello <00:02.50>world <00:03.00>test
[00:04.50]
[00:06.00]Second <00:06.80>line
    `.trim();

    const parsed1 = parseEnhancedLrc(originalElrc);
    const written = writeEnhancedLrc(parsed1.lines, parsed1.meta);
    const parsed2 = parseEnhancedLrc(written);

    expect(parsed2.lines.length).toBe(parsed1.lines.length);
    expect(parsed2.lines[0].text).toBe(parsed1.lines[0].text);
    expect(parsed2.lines[0].start).toBe(parsed1.lines[0].start);
    expect(parsed2.lines[0].words.length).toBe(parsed1.lines[0].words.length);
    expect(parsed2.lines[0].words[0].text).toBe(parsed1.lines[0].words[0].text);
  });

  it('derives word timings from standard LRC using character weights and punctuation', () => {
    const raw = parseLrc(`
[00:02.00]Short phrase, with a comma.
[00:06.00]Next line starts here.
    `.trim());

    const synced = deriveWordTimingsFromLrc(raw);
    expect(synced.length).toBe(2);
    expect(synced[0].words.length).toBe(5);
    // Words ending in punctuation should have valid start and end
    for (const w of synced[0].words) {
      expect(w.end).toBeGreaterThan(w.start);
    }
  });
});

