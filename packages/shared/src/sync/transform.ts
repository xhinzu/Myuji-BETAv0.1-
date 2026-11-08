import { LyricTransform, SyncedLyricLine, LyricWord } from '../types';

export const MIN_SPEED = 0.5;
export const MAX_SPEED = 2.0;
export const DEFAULT_SPEED = 1.0;
export const DEFAULT_OFFSET = 0.0;

/**
 * Calculates current lyric time given playback clock `t`, speed, and offset.
 * Equation: lyricTime = speed * t + offset
 */
export function calculateLyricTime(
  playbackTime: number,
  transform: LyricTransform
): number {
  return transform.speed * playbackTime + transform.offset;
}

/**
 * Converts log-scale slider value (0.0 to 1.0) into playback speed (0.5x to 2.0x).
 * Center value (0.5) corresponds exactly to 1.0x.
 */
export function sliderValueToSpeed(sliderVal: number): number {
  const clamped = Math.max(0, Math.min(1, sliderVal));
  // Map 0 -> 0.5, 0.5 -> 1.0, 1 -> 2.0 using power curve: 2^(2 * (v - 0.5))
  const exponent = 2 * (clamped - 0.5);
  const speed = Math.pow(2, exponent);
  return Number(speed.toFixed(3));
}

/**
 * Converts playback speed (0.5x to 2.0x) back to log-scale slider value (0.0 to 1.0).
 */
export function speedToSliderValue(speed: number): number {
  const clamped = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  // Inverse: log2(speed) / 2 + 0.5
  const sliderVal = Math.log2(clamped) / 2 + 0.5;
  return Number(sliderVal.toFixed(3));
}

/**
 * Ensures continuity when speed changes during live playback at timestamp t0:
 * lyricTime(t0) = oldSpeed * t0 + oldOffset
 * newLyricTime(t0) = newSpeed * t0 + newOffset
 * Setting them equal gives:
 * newOffset = lyricTime(t0) - newSpeed * t0
 */
export function calculateContinuityOffset(
  t0: number,
  oldTransform: LyricTransform,
  newSpeed: number
): number {
  const currentLyricTime = oldTransform.speed * t0 + oldTransform.offset;
  const newOffset = currentLyricTime - newSpeed * t0;
  return Number(newOffset.toFixed(3));
}

/**
 * Generate estimated word-level timestamps for unsynced plain-text lyrics
 */
export function estimatePlainLyricsTimings(
  plainLyrics: string,
  totalDurationSeconds = 180
): SyncedLyricLine[] {
  if (!plainLyrics || typeof plainLyrics !== 'string') return [];

  const rawLines = plainLyrics.split('\n');
  const validEntries: { text: string; isSectionBreakBefore: boolean }[] = [];
  let pendingBreak = false;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) {
      pendingBreak = true;
    } else {
      validEntries.push({ text: trimmed, isSectionBreakBefore: pendingBreak });
      pendingBreak = false;
    }
  }

  if (validEntries.length === 0) return [];

  const duration = totalDurationSeconds > 10 ? totalDurationSeconds : 180;
  const introSec = duration * 0.05;
  const outroSec = duration * 0.04;
  const lyricWindow = Math.max(10, duration - introSec - outroSec);

  const weights = validEntries.map((entry) => {
    const charLen = Math.max(12, entry.text.length);
    const breakBonus = entry.isSectionBreakBefore ? 18 : 0;
    return charLen + breakBonus;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let currentCursor = introSec;
  const result: SyncedLyricLine[] = [];

  for (let i = 0; i < validEntries.length; i++) {
    const entry = validEntries[i];
    const fraction = weights[i] / totalWeight;
    const lineDuration = Math.max(1.2, fraction * lyricWindow);

    const start = Number(currentCursor.toFixed(2));
    const end = Number((currentCursor + lineDuration).toFixed(2));
    currentCursor += lineDuration;

    const wordsRaw = entry.text.split(/\s+/).filter(Boolean);
    const words: LyricWord[] = [];
    if (wordsRaw.length > 0) {
      const wordTotalChars = wordsRaw.reduce((sum, w) => sum + Math.max(2, w.length), 0);
      let wordCursor = start;
      for (const w of wordsRaw) {
        const wFraction = Math.max(2, w.length) / wordTotalChars;
        const wDur = wFraction * lineDuration;
        const wStart = Number(wordCursor.toFixed(2));
        const wEnd = Number((wordCursor + wDur).toFixed(2));
        wordCursor += wDur;
        words.push({ text: w, start: wStart, end: wEnd });
      }
    } else {
      words.push({ text: entry.text, start, end });
    }

    result.push({
      id: i + 1,
      start,
      end,
      text: entry.text,
      words,
      isFallback: true,
    });
  }

  return result;
}
