import type { Detector, Match } from '../core/types.js';

// German tax ID (Steuerliche Identifikationsnummer): 11 digits, first digit not 0, written compact
// or in 2-3-3-3 groups with ONE kind of separator (backreference \1 rules out "47 152/039 646").
// Digits may be ASCII or full-width (U+FF10-FF19, from CJK input or PDF copy-paste); separators are
// space, slash, dot, hyphen, no-break space (U+00A0, Word) or narrow no-break space (U+202F, PDF).
// Both forms stay out of longer digit runs and glued words. A grouped ID next to another digit
// group ("Kind 2 29 381 075 632", "1/29/381/075/632", "+49 30 47 152 039 646") is still redacted,
// with a lower score, so no number in front or behind can hide it. Phone numbers that happen to
// pass the check digit get redacted as TAX_ID for now; a later PHONE detector takes the span over
// through the overlap rule (longer match wins).
// TODO(#18): once hint words land, add "Steuer-ID", "IdNr", "Identifikationsnummer", "tax id".
const D = '[0-9\\uFF10-\\uFF19]';
const D1 = '[1-9\\uFF11-\\uFF19]';
const SEP = '[ /.\\-\\u00A0\\u202F]';
const EDGE = '[\\w\\uFF10-\\uFF19]';
const COMPACT = `(?<!${EDGE})${D1}${D}{10}(?!${EDGE})`;
const GROUPED = `(?<!${EDGE})${D1}${D}(${SEP})${D}{3}\\1${D}{3}\\1${D}{3}(?!${EDGE})`;
// Digit group with a separator right before or after a grouped ID.
const NEIGHBOUR_BEFORE = new RegExp(`${D}${SEP}$`);
const NEIGHBOUR_AFTER = new RegExp(`^${SEP}${D}`);
const CANDIDATE = new RegExp(`${COMPACT}|${GROUPED}`, 'g');

/** Full-width digits to ASCII, separators dropped, so the checks below see plain "0-9". */
function toAsciiDigits(candidate: string): string {
  return candidate
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xff10 + 48))
    .replace(/[^0-9]/g, '');
}

// Check digit plus the BZSt digit-frequency rule. The check digit alone passes 1 in 10 random
// numbers, the frequency rule removes most of the rest, but it is still weaker than IBAN mod 97
// or issuer-plus-Luhn for cards, so a step below CARD.
const SCORE = 0.85;
/** Grouped ID with another digit group next to it: could be part of a longer number. */
const NEIGHBOUR_SCORE = 0.6;

/**
 * Check digit after ISO/IEC 7064, MOD 11,10 (hybrid system), as the BZSt specifies it for the
 * IdNr (BZSt, "Informationen zur Identifikationsnummer"; ISO/IEC 7064:2003, clause on MOD 11,10):
 * start with product 10; for each digit, sum = (digit + product) mod 10, a sum of 0 counts as 10,
 * product = (2 * sum) mod 11. The check digit is 11 - product, where 10 becomes 0.
 */
export function taxIdCheckDigit(first10: string): number {
  let product = 10;
  for (const ch of first10) {
    const sum = (Number(ch) + product) % 10 || 10;
    product = (2 * sum) % 11;
  }
  const check = 11 - product;
  return check === 10 ? 0 : check;
}

/**
 * BZSt rule for the first ten digits: exactly one digit appears twice or three times, every other
 * digit at most once. A digit that appears three times must not stand three in a row.
 */
export function hasValidDigitFrequency(first10: string): boolean {
  const repeated = [...'0123456789'].map((d) => first10.split(d).length - 1).filter((n) => n > 1);
  return repeated.length === 1 && repeated.every((n) => n <= 3) && !/(\d)\1\1/.test(first10);
}

/** 11 digits, no leading 0, valid digit frequency, valid ISO 7064 MOD 11,10 check digit. */
export function isValidTaxId(digits: string): boolean {
  if (!/^[1-9]\d{10}$/.test(digits)) return false;
  const first10 = digits.slice(0, 10);
  return hasValidDigitFrequency(first10) && taxIdCheckDigit(first10) === Number(digits[10]);
}

export const taxIdDetector: Detector = {
  type: 'TAX_ID',
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(CANDIDATE)) {
      if (!isValidTaxId(toAsciiDigits(m[0]))) continue;
      let score = SCORE;
      if (m[1] !== undefined) {
        const before = text.slice(Math.max(0, m.index - 2), m.index);
        const after = text.slice(m.index + m[0].length, m.index + m[0].length + 2);
        if (NEIGHBOUR_BEFORE.test(before) || NEIGHBOUR_AFTER.test(after)) score = NEIGHBOUR_SCORE;
      }
      matches.push({
        type: 'TAX_ID',
        start: m.index,
        end: m.index + m[0].length,
        value: m[0],
        score,
      });
    }
    return matches;
  },
};
