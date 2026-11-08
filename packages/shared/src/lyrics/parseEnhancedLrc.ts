import {
  SyncedLyricLine,
  LyricWord,
  LyricSyllable,
  LrcMetadata,
  ParseEnhancedLrcResult,
} from '../types';

const MAX_INPUT_SIZE_BYTES = 512 * 1024; // 500 KB limit
const MAX_LINE_COUNT = 2000;

const LINE_TIMESTAMP_REGEX = /\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
const WORD_TIMESTAMP_REGEX = /<(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>/g;
const METADATA_TAG_REGEX = /^\[(ti|ar|al|by|offset|length|id):(.*)\]$/i;

function parseTimeComponents(
  hoursStr?: string,
  minStr?: string,
  secStr?: string,
  fracStr?: string
): number {
  const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
  const minutes = minStr ? parseInt(minStr, 10) : 0;
  const seconds = secStr ? parseInt(secStr, 10) : 0;
  const fraction = fracStr ? parseInt(fracStr.padEnd(3, '0').slice(0, 3), 10) / 1000 : 0;
  return hours * 3600 + minutes * 60 + seconds + fraction;
}

function roundMs(num: number): number {
  return Math.round(num * 1000) / 1000;
}

interface RawLineItem {
  lineNum: number;
  startTimes: number[];
  textAfterTags: string;
  isEndMarker: boolean;
  precedingRealLineIndex?: number;
}

export function parseEnhancedLrc(
  rawContent: string,
  options?: { songDuration?: number }
): ParseEnhancedLrcResult {
  const emptyResult = (
    err?: string,
    format: 'enhanced' | 'lrc' | 'plain' = 'plain'
  ): ParseEnhancedLrcResult => ({
    meta: {},
    lines: [],
    synced: 'none',
    format,
    error: err,
    rawText: rawContent || '',
  });

  if (!rawContent || typeof rawContent !== 'string') {
    return emptyResult();
  }

  if (rawContent.length > MAX_INPUT_SIZE_BYTES) {
    return emptyResult('File size exceeds the 500 KB limit');
  }

  const sanitized = rawContent
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  const rawLines = sanitized.split('\n');

  if (rawLines.length > MAX_LINE_COUNT) {
    return emptyResult(`File exceeds the 2,000 lines limit (${rawLines.length} lines found)`);
  }

  const meta: LrcMetadata = {};
  const rawLineItems: RawLineItem[] = [];
  let containsEnhancedWordTags = false;
  let containsLineTimestamps = false;
  let lastRealLineIndex = -1;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const originalLine = rawLines[idx];
    const trimmed = originalLine.trim();
    if (!trimmed) continue;

    const metaMatch = trimmed.match(METADATA_TAG_REGEX);
    if (metaMatch) {
      const tagKey = metaMatch[1].toLowerCase();
      const tagValue = metaMatch[2].trim();

      switch (tagKey) {
        case 'ti':
          meta.title = tagValue;
          break;
        case 'ar':
          meta.artist = tagValue;
          break;
        case 'al':
          meta.album = tagValue;
          break;
        case 'by':
          meta.by = tagValue;
          break;
        case 'id':
          meta.id = tagValue;
          break;
        case 'offset': {
          const offsetVal = parseInt(tagValue, 10);
          if (!isNaN(offsetVal)) {
            meta.offsetMs = offsetVal;
          }
          break;
        }
        case 'length': {
          const lengthParts = tagValue.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?$/);
          if (lengthParts) {
            meta.lengthSeconds = parseTimeComponents(
              lengthParts[1],
              lengthParts[2],
              lengthParts[3],
              lengthParts[4]
            );
          }
          break;
        }
      }
      continue;
    }

    const lineTagMatches = Array.from(trimmed.matchAll(LINE_TIMESTAMP_REGEX));
    if (lineTagMatches.length > 0) {
      containsLineTimestamps = true;
      const startTimes: number[] = [];

      for (const m of lineTagMatches) {
        const time = parseTimeComponents(m[1], m[2], m[3], m[4]);
        startTimes.push(time);
      }

      const textAfterLineTags = trimmed.replace(LINE_TIMESTAMP_REGEX, '').trim();

      if (WORD_TIMESTAMP_REGEX.test(textAfterLineTags)) {
        containsEnhancedWordTags = true;
      }

      const textWithoutWordTags = textAfterLineTags.replace(WORD_TIMESTAMP_REGEX, '').trim();
      const isEndMarker = textWithoutWordTags.length === 0;

      const item: RawLineItem = {
        lineNum: idx + 1,
        startTimes,
        textAfterTags: textAfterLineTags,
        isEndMarker,
        precedingRealLineIndex: isEndMarker ? lastRealLineIndex : undefined,
      };

      rawLineItems.push(item);

      if (!isEndMarker) {
        lastRealLineIndex = rawLineItems.length - 1;
      }
    }
  }

  const globalOffsetSec = (meta.offsetMs || 0) / 1000;

  const format: 'enhanced' | 'lrc' | 'plain' = containsEnhancedWordTags
    ? 'enhanced'
    : containsLineTimestamps
    ? 'lrc'
    : 'plain';

  if (format === 'plain') {
    const lines: SyncedLyricLine[] = [];
    let lineId = 1;

    for (let idx = 0; idx < rawLines.length; idx++) {
      const lineText = rawLines[idx].trim();
      if (!lineText) continue;

      const words: LyricWord[] = lineText
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => ({
          text: w,
          start: 0,
          end: 0,
        }));

      lines.push({
        id: lineId++,
        start: 0,
        end: 0,
        text: lineText,
        words,
      });
    }

    return {
      meta,
      lines,
      synced: 'none',
      format: 'plain',
      rawText: sanitized,
    };
  }

  interface ParsedCandidateLine {
    originalIndex: number;
    start: number;
    rawText: string;
    endMarkerHint?: number;
  }

  const candidateLines: ParsedCandidateLine[] = [];

  for (let i = 0; i < rawLineItems.length; i++) {
    const item = rawLineItems[i];
    if (item.isEndMarker) {
      const prevIdx = item.precedingRealLineIndex;
      if (prevIdx !== undefined && prevIdx >= 0) {
        const markerTime = Math.max(0, item.startTimes[0] + globalOffsetSec);
        for (const cand of candidateLines) {
          if (cand.originalIndex === prevIdx) {
            cand.endMarkerHint = markerTime;
          }
        }
      }
      continue;
    }

    for (const st of item.startTimes) {
      candidateLines.push({
        originalIndex: i,
        start: Math.max(0, roundMs(st + globalOffsetSec)),
        rawText: item.textAfterTags,
      });
    }
  }

  if (candidateLines.length === 0) {
    return emptyResult('No lyric lines found in file', format);
  }

  candidateLines.sort((a, b) => a.start - b.start);

  const resultLines: SyncedLyricLine[] = [];
  let lineIdCounter = 1;

  for (let i = 0; i < candidateLines.length; i++) {
    const current = candidateLines[i];
    const nextLineStart = i + 1 < candidateLines.length ? candidateLines[i + 1].start : undefined;
    const lineStart = current.start;

    if (format === 'enhanced' && current.rawText.includes('<')) {
      const parsedWordData = parseEnhancedLineWords(
        current.rawText,
        lineStart,
        globalOffsetSec,
        current.endMarkerHint,
        nextLineStart
      );

      let lineEnd = parsedWordData.lineEnd;
      if (nextLineStart !== undefined) {
        lineEnd = Math.min(lineEnd, nextLineStart);
      }
      lineEnd = Math.max(lineStart + 0.1, lineEnd);

      const lineText = parsedWordData.words.map((w) => w.text).join(' ');

      resultLines.push({
        id: lineIdCounter++,
        start: roundMs(lineStart),
        end: roundMs(lineEnd),
        text: lineText,
        words: parsedWordData.words,
      });
    } else {
      const cleanText = current.rawText.replace(WORD_TIMESTAMP_REGEX, '').trim() || '♪';
      const tokens = cleanText.split(/\s+/).filter(Boolean);
      const tokenCount = Math.max(1, tokens.length);

      const estimatedVocalDuration = Math.max(
        1.6,
        Math.min(9.0, tokenCount * 0.40 + cleanText.length * 0.035)
      );

      let lineEnd: number;
      if (current.endMarkerHint && current.endMarkerHint > lineStart) {
        lineEnd = current.endMarkerHint;
      } else if (nextLineStart !== undefined) {
        const gap = nextLineStart - lineStart;
        if (gap <= estimatedVocalDuration + 0.8) {
          lineEnd = nextLineStart;
        } else {
          lineEnd = lineStart + estimatedVocalDuration;
        }
      } else {
        lineEnd = options?.songDuration && options.songDuration > lineStart
          ? Math.min(lineStart + estimatedVocalDuration, options.songDuration)
          : lineStart + estimatedVocalDuration;
      }

      if (nextLineStart !== undefined) {
        lineEnd = Math.min(lineEnd, nextLineStart);
      }
      lineEnd = Math.max(lineStart + 0.1, lineEnd);

      const words: LyricWord[] = [];
      const lineDur = Math.max(0.1, lineEnd - lineStart);
      const totalTokens = tokens.length;

      for (let w = 0; w < totalTokens; w++) {
        const wStart = lineStart + (w / totalTokens) * lineDur;
        const wEnd = lineStart + ((w + 1) / totalTokens) * lineDur;
        words.push({
          text: tokens[w],
          start: roundMs(wStart),
          end: roundMs(wEnd),
        });
      }

      resultLines.push({
        id: lineIdCounter++,
        start: roundMs(lineStart),
        end: roundMs(lineEnd),
        text: cleanText,
        words,
      });
    }
  }

  return {
    meta,
    lines: resultLines,
    synced: format === 'enhanced' ? 'word' : 'line',
    format,
    rawText: sanitized,
  };
}

function parseEnhancedLineWords(
  text: string,
  lineStartTime: number,
  globalOffsetSec: number,
  endMarkerHint?: number,
  nextLineStart?: number
): { words: LyricWord[]; lineEnd: number } {
  const tagRegex = /<(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?>/g;

  interface TokenChunk {
    type: 'tag' | 'text';
    value: string;
    time?: number;
  }

  const chunks: TokenChunk[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    const tagStart = match.index;
    const tagEnd = tagRegex.lastIndex;

    if (tagStart > lastIndex) {
      const textPiece = text.slice(lastIndex, tagStart);
      chunks.push({
        type: 'text',
        value: textPiece,
      });
    }

    const tagTime = parseTimeComponents(match[1], match[2], match[3], match[4]) + globalOffsetSec;

    chunks.push({
      type: 'tag',
      value: match[0],
      time: Math.max(0, roundMs(tagTime)),
    });

    lastIndex = tagEnd;
  }

  if (lastIndex < text.length) {
    const trailingText = text.slice(lastIndex);
    chunks.push({
      type: 'text',
      value: trailingText,
    });
  }

  interface TempSyllable {
    text: string;
    start: number;
  }

  interface TempWord {
    syllables: TempSyllable[];
    explicitEnd?: number;
  }

  const tempWords: TempWord[] = [];
  let currentWord: TempWord | null = null;
  let activeTagTime: number = lineStartTime;
  let closingTagTime: number | undefined = undefined;

  for (let c = 0; c < chunks.length; c++) {
    const chunk = chunks[c];

    if (chunk.type === 'tag') {
      activeTagTime = chunk.time!;

      const remainingText = chunks
        .slice(c + 1)
        .filter((k) => k.type === 'text')
        .map((k) => k.value.trim())
        .join('');

      if (!remainingText) {
        closingTagTime = activeTagTime;
        if (currentWord) {
          currentWord.explicitEnd = closingTagTime;
        } else if (tempWords.length > 0) {
          tempWords[tempWords.length - 1].explicitEnd = closingTagTime;
        }
      }
    } else {
      const textVal = chunk.value;
      const parts = textVal.split(/(\s+)/);

      for (let p = 0; p < parts.length; p++) {
        const part = parts[p];
        if (!part) continue;

        if (/^\s+$/.test(part)) {
          if (currentWord && currentWord.syllables.length > 0) {
            tempWords.push(currentWord);
            currentWord = null;
          }
        } else {
          if (!currentWord) {
            currentWord = {
              syllables: [{ text: part, start: activeTagTime }],
            };
          } else {
            currentWord.syllables.push({ text: part, start: activeTagTime });
          }
        }
      }
    }
  }

  if (currentWord && currentWord.syllables.length > 0) {
    tempWords.push(currentWord);
  }

  if (tempWords.length === 0) {
    const fallbackClean = text.replace(tagRegex, '').trim() || '♪';
    const fallbackEnd = nextLineStart ?? lineStartTime + 1.5;
    return {
      words: [
        {
          text: fallbackClean,
          start: roundMs(lineStartTime),
          end: roundMs(fallbackEnd),
        },
      ],
      lineEnd: roundMs(fallbackEnd),
    };
  }

  const finalWords: LyricWord[] = [];

  for (let w = 0; w < tempWords.length; w++) {
    const tw = tempWords[w];
    const fullWordText = tw.syllables.map((s) => s.text).join('');
    let wordStart = tw.syllables[0].start;

    if (w > 0 && wordStart <= finalWords[w - 1].start) {
      wordStart = finalWords[w - 1].start + 0.01;
    }

    let wordEnd: number;
    if (w < tempWords.length - 1) {
      wordEnd = tempWords[w + 1].syllables[0].start;
    } else {
      if (tw.explicitEnd && tw.explicitEnd > wordStart) {
        wordEnd = tw.explicitEnd;
      } else if (closingTagTime && closingTagTime > wordStart) {
        wordEnd = closingTagTime;
      } else if (endMarkerHint && endMarkerHint > wordStart) {
        wordEnd = endMarkerHint;
      } else if (nextLineStart && nextLineStart > wordStart) {
        wordEnd = nextLineStart;
      } else {
        wordEnd = wordStart + 1.5;
      }
    }

    if (wordEnd <= wordStart) {
      wordEnd = wordStart + 0.1;
    }

    let syllables: LyricSyllable[] | undefined = undefined;
    if (tw.syllables.length > 1) {
      syllables = [];
      for (let s = 0; s < tw.syllables.length; s++) {
        const syl = tw.syllables[s];
        const sylStart = s === 0 ? wordStart : Math.max(wordStart + 0.01 * s, syl.start);
        const nextSylStart = s < tw.syllables.length - 1 ? tw.syllables[s + 1].start : wordEnd;
        const sylEnd = Math.max(sylStart + 0.05, nextSylStart);
        syllables.push({
          text: syl.text,
          start: roundMs(sylStart),
          end: roundMs(sylEnd),
        });
      }
    }

    finalWords.push({
      text: fullWordText,
      start: roundMs(wordStart),
      end: roundMs(wordEnd),
      syllables,
    });
  }

  const lastWord = finalWords[finalWords.length - 1];
  let lineEnd = lastWord.end;
  if (nextLineStart !== undefined) {
    lineEnd = Math.min(lineEnd, nextLineStart);
  }
  lineEnd = Math.max(lineStartTime + 0.1, lineEnd);

  return {
    words: finalWords,
    lineEnd: roundMs(lineEnd),
  };
}
