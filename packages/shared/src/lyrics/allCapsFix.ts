import { ENGLISH_LEXICON } from '../lexicon';

/**
 * Builds a fast lookup set of recognized proper nouns from the master lexicon
 */
const PROPER_NOUNS = new Set<string>();

for (const entry of ENGLISH_LEXICON) {
  if (entry.words) {
    for (const kw of entry.words) {
      if (kw.length > 2) {
        PROPER_NOUNS.add(kw.toLowerCase());
      }
    }
  }
}

// Common English pronouns & proper words to always capitalize
PROPER_NOUNS.add('i');
PROPER_NOUNS.add('god');
PROPER_NOUNS.add('lord');
PROPER_NOUNS.add('jesus');
PROPER_NOUNS.add('christmas');
PROPER_NOUNS.add('sunday');
PROPER_NOUNS.add('monday');
PROPER_NOUNS.add('tuesday');
PROPER_NOUNS.add('wednesday');
PROPER_NOUNS.add('thursday');
PROPER_NOUNS.add('friday');
PROPER_NOUNS.add('saturday');

const TAG_REGEX = /\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]|<\d{1,2}:\d{2}(?:\.\d{1,3})?>/g;

/**
 * Fixes ALL-CAPS lyrics while keeping timestamps, sentence casing, and lexicon proper nouns
 */
export function fixAllCapsLrc(rawLrc: string): string {
  if (!rawLrc) return '';

  const lines = rawLrc.split('\n');
  return lines
    .map((line) => {
      // Don't touch metadata tags like [ti:...], [ar:...]
      if (/^\[(ti|ar|al|by|offset|length|id):/i.test(line.trim())) {
        return line;
      }

      // Check if line contains letters and is predominantly uppercase
      const lettersOnly = line.replace(/[^a-zA-Z]/g, '');
      if (lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()) {
        return fixLineCasing(line);
      }
      return line;
    })
    .join('\n');
}

export function fixLineCasing(line: string): string {
  // Extract all tags so we don't mutate timestamp tokens
  const tags: string[] = [];
  const placeholder = '___TAG_PLACEHOLDER___';

  const textWithoutTags = line.replace(TAG_REGEX, (match) => {
    tags.push(match);
    return placeholder;
  });

  const words = textWithoutTags.split(/\s+/);
  let isStartOfSentence = true;

  const casedWords = words.map((w) => {
    if (w === placeholder || w.includes(placeholder)) {
      return w;
    }

    // Strip leading punctuation
    const leadingPunct = w.match(/^[^a-zA-Z0-9]+/)?.[0] || '';
    const trailingPunct = w.match(/[^a-zA-Z0-9]+$/)?.[0] || '';
    const core = w.slice(leadingPunct.length, w.length - trailingPunct.length);

    if (!core) return w;

    let casedCore = core.toLowerCase();
    const coreLower = casedCore;

    if (coreLower === 'i' || coreLower.startsWith("i'") || coreLower.startsWith("i’")) {
      casedCore = 'I' + casedCore.slice(1);
    } else if (PROPER_NOUNS.has(coreLower) || isStartOfSentence) {
      casedCore = casedCore[0].toUpperCase() + casedCore.slice(1);
    }

    if (trailingPunct.includes('.') || trailingPunct.includes('!') || trailingPunct.includes('?')) {
      isStartOfSentence = true;
    } else {
      isStartOfSentence = false;
    }

    return leadingPunct + casedCore + trailingPunct;
  });

  let result = casedWords.join(' ');

  // Restore tags
  let tagIdx = 0;
  result = result.replace(new RegExp(placeholder, 'g'), () => {
    return tags[tagIdx++] || '';
  });

  return result;
}
