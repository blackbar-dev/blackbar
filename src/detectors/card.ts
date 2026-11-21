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
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(CANDIDATE)) {
      if (isValidCard(m[0].replace(/[ -]/g, ''))) {
        matches.push({ type: 'CARD', start: m.index, end: m.index + m[0].length, value: m[0] });
      }
    }
    return matches;
  },
};
