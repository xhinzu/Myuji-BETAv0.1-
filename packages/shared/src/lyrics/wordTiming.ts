import { RawParsedLine } from './parseLrc';
import { LyricWord, SyncedLyricLine } from '../types';

const PUNCTUATION_END_REGEX = /[.,!?;:—~…)\]"”’]$/;

/**
 * Derives realistic word-by-word timestamps from line-level synced lyrics.
 */
export function deriveWordTimingsFromLrc(
  rawLines: RawParsedLine[],
  songDuration?: number
): SyncedLyricLine[] {
  if (!rawLines || rawLines.length === 0) return [];

  const syncedLines: SyncedLyricLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const current = rawLines[i];
    const lineStart = current.time;

    let lineEnd: number;
    if (i + 1 < rawLines.length) {
      const nextStart = rawLines[i + 1].time;
      const rawSpan = nextStart - lineStart;
      if (rawSpan <= 0) {
        lineEnd = lineStart + 3.0;
      } else if (rawSpan > 12.0) {
        lineEnd = lineStart + Math.min(9.0, rawSpan);
      } else {
        lineEnd = nextStart;
      }
    } else {
      if (songDuration && songDuration > lineStart) {
        lineEnd = Math.min(lineStart + 6.0, songDuration);
      } else {
        lineEnd = lineStart + 6.0;
      }
    }

    const lineDuration = Math.max(0.5, lineEnd - lineStart);
    const rawTokens = current.text.split(/\s+/).filter(Boolean);

    if (rawTokens.length === 0) {
      syncedLines.push({
        id: current.id,
        start: lineStart,
        end: lineEnd,
        text: current.text,
        words: [
          {
            text: current.text || '♪',
            start: lineStart,
            end: lineEnd,
          },
        ],
        isFallback: true,
      });
      continue;
    }

    const weights: number[] = rawTokens.map((token) => {
      let weight = Math.max(1, token.length);
      if (PUNCTUATION_END_REGEX.test(token)) {
        weight *= 1.45;
      }
      return weight;
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0);

    let runningTime = lineStart;
    const words: LyricWord[] = [];

    for (let w = 0; w < rawTokens.length; w++) {
      const token = rawTokens[w];
      const fraction = weights[w] / totalWeight;
      const wordDuration = fraction * lineDuration;
      const wordStart = runningTime;
      const wordEnd = w === rawTokens.length - 1 ? lineEnd : wordStart + wordDuration;

      words.push({
        text: token,
        start: Number(wordStart.toFixed(2)),
        end: Number(wordEnd.toFixed(2)),
      });

      runningTime = wordEnd;
    }

    syncedLines.push({
      id: current.id,
      start: Number(lineStart.toFixed(2)),
      end: Number(lineEnd.toFixed(2)),
      text: current.text,
      words,
      isFallback: true,
    });
  }

  return syncedLines;
}

