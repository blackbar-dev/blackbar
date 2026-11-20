import type { Detector, Match } from '../core/types.js';

// Practical, not full RFC 5322: what people actually write in running text.
// Local part: letters, digits and . _ % + - (no leading, trailing or double dot).
// Domain: labels of letters, digits and hyphens (not at the edges), TLD of 2+ letters.
const LOCAL = String.raw`[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*`;
const LABEL = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?';
const EMAIL = new RegExp(
  String.raw`(?<![A-Za-z0-9._%+-])${LOCAL}@(?:${LABEL}\.)+[A-Za-z]{2,63}(?![A-Za-z0-9-]|\.[A-Za-z0-9])`,
  'g',
);

export const emailDetector: Detector = {
  type: 'EMAIL',
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(EMAIL)) {
      const value = m[0];
      const local = value.slice(0, value.indexOf('@'));
      if (local.length > 64 || value.length > 254) continue;
      matches.push({ type: 'EMAIL', start: m.index, end: m.index + value.length, value });
    }
    return matches;
  },
};
