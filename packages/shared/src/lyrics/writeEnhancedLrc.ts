import { SyncedLyricLine, LrcMetadata } from '../types';

function formatTimestamp(seconds: number, bracketType: 'square' | 'angle' = 'square'): string {
  const clamped = Math.max(0, seconds);
  const mins = Math.floor(clamped / 60);
  const secs = Math.floor(clamped % 60);
  const ms = Math.floor((clamped % 1) * 100);

  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const xx = String(ms).padStart(2, '0');

  return bracketType === 'square' ? `[${mm}:${ss}.${xx}]` : `<${mm}:${ss}.${xx}>`;
}

/**
 * Serializes lines and metadata into standard Enhanced-LRC text format.
 */
export function writeEnhancedLrc(
  lines: SyncedLyricLine[],
  meta?: LrcMetadata,
  options?: { includeEndMarkers?: boolean }
): string {
  const out: string[] = [];

  // 1. Write metadata tags
  if (meta?.artist) out.push(`[ar:${meta.artist}]`);
  if (meta?.title) out.push(`[ti:${meta.title}]`);
  if (meta?.album) out.push(`[al:${meta.album}]`);
  if (meta?.by) {
    out.push(`[by:${meta.by}]`);
  } else {
    out.push(`[by:MyuJiku aligner v2.0]`);
  }
  if (meta?.lengthSeconds) {
    const mins = Math.floor(meta.lengthSeconds / 60);
    const secs = Math.floor(meta.lengthSeconds % 60);
    out.push(`[length:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}]`);
  }
  if (meta?.offsetMs) out.push(`[offset:${meta.offsetMs}]`);

  // 2. Write each line
  const includeEndMarkers = options?.includeEndMarkers ?? true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineTag = formatTimestamp(line.start, 'square');

    if (line.words && line.words.length > 0) {
      const wordParts: string[] = [];
      for (let w = 0; w < line.words.length; w++) {
        const word = line.words[w];
        if (w === 0) {
          // First word uses line start tag directly
          wordParts.push(word.text);
        } else {
          // Subsequent words have leading timestamp
          const wordTag = formatTimestamp(word.start, 'angle');
          wordParts.push(`${wordTag}${word.text}`);
        }
      }
      out.push(`${lineTag}${wordParts.join(' ')}`);
    } else {
      out.push(`${lineTag}${line.text}`);
    }

    // Add empty end marker if there is a gap before next line
    if (includeEndMarkers) {
      const nextLine = lines[i + 1];
      const gapToNext = nextLine ? nextLine.start - line.end : 1.0;
      if (gapToNext >= 0.5) {
        out.push(formatTimestamp(line.end, 'square'));
      }
    }
  }

  return out.join('\n');
}

