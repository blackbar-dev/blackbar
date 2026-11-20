import type { Detector, Match } from '../core/types.js';

// IBAN length per country (ISO 13616, SWIFT IBAN registry). Unknown countries are rejected.
// biome-ignore format: compact table is easier to check against the registry
export const IBAN_LENGTHS: Readonly<Record<string, number>> = {
  AD: 24, AE: 23, AL: 28, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BI: 27, BR: 29,
  BY: 28, CH: 21, CR: 22, CY: 28, CZ: 24, DE: 22, DJ: 27, DK: 18, DO: 28, EE: 20, EG: 29,
  ES: 24, FI: 18, FK: 18, FO: 18, FR: 27, GB: 22, GE: 22, GI: 23, GL: 18, GR: 27, GT: 28,
  HR: 21, HU: 28, IE: 22, IL: 23, IQ: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
  LC: 32, LI: 21, LT: 20, LU: 20, LV: 21, LY: 25, MC: 27, MD: 24, ME: 22, MK: 19, MN: 20,
  MR: 27, MT: 31, MU: 30, NI: 28, NL: 18, NO: 15, OM: 23, PK: 24, PL: 28, PS: 29, QA: 29,
  RO: 24, RS: 22, RU: 33, SA: 24, SC: 31, SD: 18, SE: 24, SI: 19, SK: 24, SM: 27, SO: 23,
  ST: 25, SV: 28, TL: 23, TN: 24, TR: 26, UA: 29, VA: 22, VG: 24, XK: 20, YE: 30,
};

// Country code, two check digits, then the BBAN either compact or in groups of 4
// separated by single spaces (the printed form "DE89 3704 0044 0532 0130 00").
const IBAN =
  /(?<![A-Za-z0-9])[A-Z]{2}\d{2}(?:[A-Za-z0-9]{11,30}|(?: [A-Za-z0-9]{4}){2,7}(?: [A-Za-z0-9]{1,4})?)(?![A-Za-z0-9])/g;

/** ISO 7064 MOD 97-10 check, as used by IBAN. */
export function isValidIban(raw: string): boolean {
  const iban = raw.replace(/ /g, '').toUpperCase();
  const expected = IBAN_LENGTHS[iban.slice(0, 2)];
  if (expected === undefined || iban.length !== expected) return false;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    const digits = code >= 65 ? String(code - 55) : ch; // A=10 … Z=35
    for (const d of digits) remainder = (remainder * 10 + (d.charCodeAt(0) - 48)) % 97;
  }
  return remainder === 1;
}

export const ibanDetector: Detector = {
  type: 'IBAN',
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(IBAN)) {
      // The spaced form may have swallowed a following word, e.g. "… 0130 00 und".
      // Try the full match first, then shorter prefixes ending at a group boundary.
      let value = m[0];
      while (value && !isValidIban(value)) {
        const cut = value.lastIndexOf(' ');
        value = cut > 0 ? value.slice(0, cut) : '';
      }
      if (value) matches.push({ type: 'IBAN', start: m.index, end: m.index + value.length, value });
    }
    return matches;
  },
};
