import { describe, it, expect } from 'vitest';
import { fixAllCapsLrc } from '../src/lyrics/allCapsFix';

describe('fixAllCapsLrc', () => {
  it('converts ALL-CAPS lines to sentence case while preserving line timestamps', () => {
    const input = '[00:12.30] NEVER GONNA GIVE YOU UP';
    const output = fixAllCapsLrc(input);
    expect(output).toBe('[00:12.30] Never gonna give you up');
  });

  it('preserves word timestamps in Enhanced LRC', () => {
    const input = '[00:15.00] <00:15.00> NEVER <00:15.50> GONNA <00:16.00> LET';
    const output = fixAllCapsLrc(input);
    expect(output).toBe('[00:15.00] <00:15.00> Never <00:15.50> gonna <00:16.00> let');
  });

  it('capitalizes the pronoun I and contractions', () => {
    const input = '[01:05.10] AND I SAY I\'M NEVER LEAVING';
    const output = fixAllCapsLrc(input);
    expect(output).toBe("[01:05.10] And I say I'm never leaving");
  });

  it('leaves metadata tags unchanged', () => {
    const input = '[ti:NEVER GONNA GIVE YOU UP]\n[ar:RICK ASTLEY]\n[00:10.00] WE HAVE KNOWN EACH OTHER';
    const output = fixAllCapsLrc(input);
    expect(output).toContain('[ti:NEVER GONNA GIVE YOU UP]');
    expect(output).toContain('[ar:RICK ASTLEY]');
    expect(output).toContain('[00:10.00] We have known each other');
  });
});

