import type { Detector, Match } from '../core/types.js';

// Six hex pairs with ONE kind of separator (backreference \1 rules out "00:1a-2b:…").
// The lookarounds refuse longer runs ("aa:bb:…:ff:00", IPv6) and glued words
// ("logo-ab-cd-…", "img_de-ad-…"), but allow a trailing sentence period. The tail of a
// compressed IPv6 ("fe80::1a:2b:3c:4d:5e:6f") still matches here; the longer IP match wins
// the overlap in detect(), and corpus case mac-015 guards that.
const PAIRS =
  /(?<!\w|\w[:-])[0-9A-Fa-f]{2}([:-])[0-9A-Fa-f]{2}(?:\1[0-9A-Fa-f]{2}){4}(?!\w|[:-]\w)/g;

// Dotted three-group form used by network gear ("001a.2b3c.4d5e").
const DOTTED = /(?<![\w.])[0-9A-Fa-f]{4}(?:\.[0-9A-Fa-f]{4}){2}(?!\w|\.\w)/g;

// Structure only (hex pairs, one kind of separator), no checksum. Hex dumps and hash fragments
// can take the same shape, so the lowest built-in score, like IP.
const SCORE = 0.7;

/** All-zero and broadcast addresses identify no device, so they are not personal data. */
export function isUsableMac(value: string): boolean {
  const hex = value.replace(/[:.-]/g, '').toLowerCase();
  return hex !== '000000000000' && hex !== 'ffffffffffff';
}

export const macDetector: Detector = {
  type: 'MAC',
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(PAIRS)) {
      if (!isUsableMac(m[0])) continue;
      matches.push({
        type: 'MAC',
        start: m.index,
        end: m.index + m[0].length,
        value: m[0],
        score: SCORE,
      });
    }
    for (const m of text.matchAll(DOTTED)) {
      // Digits only ("2026.1121.0930") is far more often a build number or date than a MAC.
      if (!isUsableMac(m[0]) || /^[\d.]+$/.test(m[0])) continue;
      matches.push({
        type: 'MAC',
        start: m.index,
        end: m.index + m[0].length,
        value: m[0],
        score: SCORE,
      });
    }
    return matches.sort((a, b) => a.start - b.start);
  },
};
