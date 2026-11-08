import { describe, it, expect } from 'vitest';
import {
  calculateLyricTime,
  sliderValueToSpeed,
  speedToSliderValue,
  calculateContinuityOffset,
  estimatePlainLyricsTimings,
} from '../src/sync/transform';

describe('Sync Engine Math & Transformations', () => {
  it('computes linear lyric time correctly', () => {
    const t = 10;
    const transform = { speed: 1.2, offset: -0.5 };
    // lyricTime = 1.2 * 10 - 0.5 = 11.5
    expect(calculateLyricTime(t, transform)).toBeCloseTo(11.5);
  });

  it('converts log-scale slider value to speed and back with high precision', () => {
    // 0.5 slider value must equal 1.0x speed
    expect(sliderValueToSpeed(0.5)).toBe(1.0);
    expect(speedToSliderValue(1.0)).toBe(0.5);

    // 0.0 slider value must equal 0.5x speed
    expect(sliderValueToSpeed(0.0)).toBe(0.5);
    expect(speedToSliderValue(0.5)).toBe(0.0);

    // 1.0 slider value must equal 2.0x speed
    expect(sliderValueToSpeed(1.0)).toBe(2.0);
    expect(speedToSliderValue(2.0)).toBe(1.0);

    // Round-trip check across diverse speeds
    for (const testSpeed of [0.65, 0.8, 1.0, 1.25, 1.75]) {
      const slider = speedToSliderValue(testSpeed);
      const restored = sliderValueToSpeed(slider);
      expect(restored).toBeCloseTo(testSpeed, 2);
    }
  });

  it('calculates continuity offset correctly when changing speed mid-song', () => {
    const t0 = 45; // current playback position
    const oldTransform = { speed: 1.0, offset: 2.0 };
    // current lyricTime = 1.0 * 45 + 2.0 = 47.0
    // new speed = 1.5
    // newOffset = 47.0 - 1.5 * 45 = 47.0 - 67.5 = -20.5
    const newOffset = calculateContinuityOffset(t0, oldTransform, 1.5);
    expect(newOffset).toBeCloseTo(-20.5, 2);

    // Verify continuity: oldLyricTime == newLyricTime at t0
    const oldLyricTime = calculateLyricTime(t0, oldTransform);
    const newLyricTime = calculateLyricTime(t0, { speed: 1.5, offset: newOffset });
    expect(newLyricTime).toBeCloseTo(oldLyricTime, 2);
  });

  it('estimates word-level timings for plain text lyrics', () => {
    const plain = `
First verse first line
Second verse line with more characters in it

Third verse after an instrumental break
    `.trim();

    const result = estimatePlainLyricsTimings(plain, 120);
    expect(result.length).toBe(3);
    expect(result[0].words.length).toBe(4);
    expect(result[1].words.length).toBe(8);
    expect(result[2].words.length).toBe(6);

    // Timestamps must be strictly ascending
    expect(result[0].start).toBeLessThan(result[0].end);
    expect(result[0].end).toBeLessThanOrEqual(result[1].start);
    expect(result[1].end).toBeLessThanOrEqual(result[2].start);
  });
});

