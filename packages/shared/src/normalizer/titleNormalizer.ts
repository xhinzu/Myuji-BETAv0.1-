/**
 * Comprehensive Title & Artist Normalizer for MyuJiku v2 (@myujiku/shared)
 * Ports and enhances the robust regex-based music metadata normalization engine.
 */

export interface CandidatePair {
  artist: string;
  title: string;
  featuredArtists: string[];
  isLive: boolean;
  confidence: number;
}

/**
 * Sanitizes search queries, track titles, and artist strings
 */
export function sanitizeQueryText(input: string): string {
  if (!input) return '';

  let str = input;

  // 1. Strip URLs with protocols
  str = str.replace(/https?:\/\/[^\s]+/gi, ' ');
  str = str.replace(/ftp:\/\/[^\s]+/gi, ' ');

  // 2. Strip explicit domain names & domain-like tokens
  str = str.replace(
    /\b(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be|[a-zA-Z0-9-]+\.(?:com|org|net|edu|gov|io|co|be|tv|ai|me|info|biz|xyz|app|fm|cc|ly))(?:\/[^\s]*)?\b/gi,
    ' '
  );
  str = str.replace(/\bwww\.[a-zA-Z0-9-]+\b/gi, ' ');

  // 3. Strip "Video Lyric" / "Lyric Video"
  str = str.replace(/\bvideo\s+lyric(?:s)?(?:\s*#?\d+)?\b/gi, ' ');
  str = str.replace(/\blyric(?:s)?\s+video(?:\s*#?\d+)?\b/gi, ' ');

  // 4. Strip counters like "#2", "#1", "(#2)", "[#3]"
  str = str.replace(/(?:^|\s)(?:#\d+|\(#\d+\)|\[#\d+\])(?:\s|$)/g, ' ');

  // 5. Strip hashtags
  str = str.replace(/#[a-zA-Z0-9_-]+/g, ' ');

  // 6. Strip emojis and pictographs
  str = str.replace(/[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{FE00}-\u{FE0F}]/gu, ' ');

  // 7. Strip trailing or standalone " - YouTube", "YouTube", "VEVO", "Topic"
  str = str.replace(/\s*(?:[-–—|/]\s*)?youtube(?:\s+music)?(?:\s*[-–—|/])?/gi, ' ');
  str = str.replace(/\s*-\s*topic\b/gi, ' ');
  str = str.replace(/\bvevo\b/gi, ' ');

  // 8. Strip standalone "Official Video", "Official Music Video", "Official Audio"
  str = str.replace(/\bofficial\s+(?:music\s+)?video\b/gi, ' ');
  str = str.replace(/\bofficial\s+audio\b/gi, ' ');

  // 9. Remove empty bracket pairs left behind: (), [], {}
  str = str.replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, ' ');

  // 10. Clean up multiple separators and leading/trailing dashes/whitespace
  str = str.replace(/\s*[-–—|/]+\s*[-–—|/]+\s*/g, ' - ');
  str = str.replace(/^[\s\-–—|/:]+|[\s\-–—|/:]+$/g, '');
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Clean track title for lyrics matching (removes bracketed tags, video suffixes, etc.)
 */
export function cleanTitleForLyrics(rawTitle: string): string {
  if (!rawTitle) return '';

  let cleaned = rawTitle;
  // 1. Remove trailing separators like "// 24/7 Chill Radio", "| Lofi Chill"
  cleaned = cleaned.replace(/\s*(?:\/{2,}|[|\\–—]).*$/, '');

  cleaned = sanitizeQueryText(cleaned);

  // 2. Remove bracketed noise
  cleaned = cleaned.replace(/\[.*?\]/g, '');

  // 3. Remove parenthetical video/audio tags
  cleaned = cleaned.replace(
    /\(.*?(official|video|audio|lyric|visualizer|remaster|live|edit|prod|clip|4k|hd).*?\)/gi,
    ''
  );

  // 4. Remove trailing "feat." / "ft." / "featuring" clauses
  cleaned = cleaned.replace(/\s*(?:feat\.|ft\.|featuring)\s+.*$/i, '');

  // 5. Remove "Slowed + Reverb" or "(Slowed & Reverb)"
  cleaned = cleaned.replace(/\s*[-–—]?\s*(?:slowed\s*\+?\s*reverb|speed\s*up).*$/i, '');

  // 6. Clean quotes and extra whitespace
  cleaned = cleaned.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

  return cleaned || rawTitle.trim();
}

/**
 * Cleans artist name (strips " - Topic", "VEVO", feat. clauses)
 */
export function cleanArtistForLyrics(rawArtist: string): string {
  if (!rawArtist) return '';
  let str = rawArtist;
  // Strip VEVO suffix
  str = str.replace(/vevo$/i, '');
  return sanitizeQueryText(str)
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\s*(?:feat\.|ft\.|featuring)\s+.*$/i, '')
    .trim();
}

/**
 * Splits raw title into artist and song title candidates if formatted as "Artist - Title"
 */
export function parseArtistTitle(rawString: string): { artist: string; title: string } | null {
  const sanitized = sanitizeQueryText(rawString);
  const parts = sanitized.split(/\s*[-–—]\s*/);
  if (parts.length >= 2) {
    const artist = cleanArtistForLyrics(parts[0]);
    const title = cleanTitleForLyrics(parts.slice(1).join(' - '));
    if (artist && title) {
      return { artist, title };
    }
  }
  return null;
}
