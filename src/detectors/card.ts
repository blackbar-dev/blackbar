import type { Detector, Match } from '../core/types.js';

// A digit run, optionally split into groups by ONE kind of separator (backreference \1 rules out
// "4111 1111-1111 1111"). The lookarounds keep us out of longer digit runs; length, issuer
// and checksum are checked afterwards, so the regex can stay dumb.
const CANDIDATE = /(?<!\d)\d+(?:([ -])\d+(?:\1\d+)*)?(?!\d)/g;

// Issuer prefix and allowed lengths. Luhn alone passes 1 in 10 random numbers; requiring a known
// issuer is what keeps order numbers and timestamps out.
const ISSUERS: readonly { prefix: RegExp; lengths: readonly number[] }[] = [
  { prefix: /^4/, lengths: [13, 16, 19] }, // Visa
  { prefix: /^(?:5[1-5]|2(?:2[2-9]\d|[3-6]\d\d|7[01]\d|720))/, lengths: [16] }, // Mastercard
  { prefix: /^3[47]/, lengths: [15] }, // Amex
  { prefix: /^(?:6011|64[4-9]|65)/, lengths: [16, 17, 18, 19] }, // Discover
  { prefix: /^35(?:2[89]|[3-8]\d)/, lengths: [16, 17, 18, 19] }, // JCB
  { prefix: /^(?:30[0-5]|36|38|39)/, lengths: [14, 15, 16, 17, 18, 19] }, // Diners
  { prefix: /^62/, lengths: [16, 17, 18, 19] }, // UnionPay
  { prefix: /^(?:50|5[6-8]|6[0-9])/, lengths: [13, 14, 15, 16, 17, 18, 19] }, // Maestro
];

// Issuer prefix plus Luhn. Luhn passes 1 in 10, weaker than mod 97, so a step below IBAN.
const SCORE = 0.9;

/** Luhn checksum: double every second digit from the right. */
export function luhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** 13-19 digits, known issuer prefix for that length, valid Luhn. */
export function isValidCard(digits: string): boolean {
  return (
    ISSUERS.some((i) => i.prefix.test(digits) && i.lengths.includes(digits.length)) && luhn(digits)
  );
}

export const cardDetector: Detector = {
  type: 'CARD',
  hints: [
    'Karte',
    'Kreditkarte',
    'Kartennummer',
    'card',
    'credit card',
    'card number',
    'Visa',
    'Mastercard',
  ],
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(CANDIDATE)) {
      // A candidate may glue a card to its neighbours ("12 4111111111111111"). Split it into
      // digit groups and take the longest valid run of groups at each position.
      const groups = [...m[0].matchAll(/\d+/g)].map((g) => ({
        digits: g[0],
        start: m.index + g.index,
        end: m.index + g.index + g[0].length,
      }));
      for (let i = 0; i < groups.length; ) {
        let last = -1;
        let digits = '';
        for (const [j, g] of groups.slice(i).entries()) {
          digits += g.digits;
          if (digits.length > 19) break;
          if (isValidCard(digits)) last = i + j;
        }
        const first = groups[i];
        const stop = groups[last];
        if (!first || !stop) {
          i++;
          continue;
        }
        matches.push({
          type: 'CARD',
          start: first.start,
          end: stop.end,
          value: text.slice(first.start, stop.end),
          score: SCORE,
        });
        i = last + 1;
      }
    }
    return matches;
  },
};
