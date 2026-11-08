import { describe, it, expect } from 'vitest';
import {
  cleanTitleForLyrics,
  cleanArtistForLyrics,
  sanitizeQueryText,
  parseArtistTitle,
} from '../src/normalizer/titleNormalizer';

describe('Music Metadata Normalizer', () => {
  it('cleans YouTube video titles removing bracketed and parenthetical noise', () => {
    const raw = 'The Weeknd - Blinding Lights (Official Video) [4K 60FPS]';
    expect(cleanTitleForLyrics(raw)).toBe('The Weeknd - Blinding Lights');

    const withFeat = 'Dua Lipa - Levitating feat. DaBaby (Official Music Video)';
    expect(cleanTitleForLyrics(withFeat)).toBe('Dua Lipa - Levitating');

    const withSuffix = 'Lofi Girl - Relaxing Beats // 24/7 Chill Radio';
    expect(cleanTitleForLyrics(withSuffix)).toBe('Lofi Girl - Relaxing Beats');
  });

  it('cleans artist names removing Topic and VEVO markers', () => {
    expect(cleanArtistForLyrics('Taylor Swift - Topic')).toBe('Taylor Swift');
    expect(cleanArtistForLyrics('TheWeekndVEVO')).toBe('TheWeeknd');
    expect(cleanArtistForLyrics('Ed Sheeran feat. Khalid')).toBe('Ed Sheeran');
  });

  it('sanitizes query text stripping URLs and hashtags', () => {
    const query = 'Check out https://www.youtube.com/watch?v=123 #trending song';
    const cleaned = sanitizeQueryText(query);
    expect(cleaned).not.toContain('https://');
    expect(cleaned).not.toContain('#trending');
    expect(cleaned).toContain('Check out');
    expect(cleaned).toContain('song');
  });

  it('parses artist and title from standard "Artist - Title" strings', () => {
    const result = parseArtistTitle('Post Malone - Circles (Official Audio)');
    expect(result).not.toBeNull();
    expect(result?.artist).toBe('Post Malone');
    expect(result?.title).toBe('Circles');
  });
});
