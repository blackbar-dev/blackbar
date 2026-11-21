import { describe, expect, it } from 'vitest';
import {
  hasValidDigitFrequency,
  isValidTaxId,
  taxIdCheckDigit,
  taxIdDetector,
} from '../../src/detectors/tax-id.js';
import { redact, restore } from '../../src/index.js';

const values = (text: string) => taxIdDetector.find(text).map((m) => m.value);

describe('taxIdCheckDigit (ISO 7064 MOD 11,10)', () => {
  it('matches the published BZSt sample', () => {
    expect(taxIdCheckDigit('8609574271')).toBe(9);
  });
  it('computes made-up numbers, including the 10 -> 0 case', () => {
    expect(taxIdCheckDigit('4715203964')).toBe(6);
    expect(taxIdCheckDigit('2938107563')).toBe(2);
    expect(taxIdCheckDigit('4715203962')).toBe(0);
  });
});

describe('hasValidDigitFrequency', () => {
  it('accepts one digit twice or three times (not in a row)', () => {
    expect(hasValidDigitFrequency('4715203964')).toBe(true);
    expect(hasValidDigitFrequency('5170582593')).toBe(true);
  });
  it('rejects all-distinct, two repeated digits, four times, and three in a row', () => {
    expect(hasValidDigitFrequency('1234567890')).toBe(false);
    expect(hasValidDigitFrequency('1123456678')).toBe(false);
    expect(hasValidDigitFrequency('1213141567')).toBe(false);
    expect(hasValidDigitFrequency('5550123478')).toBe(false);
  });
});

describe('isValidTaxId', () => {
  it('accepts made-up numbers with valid check digits', () => {
    expect(isValidTaxId('47152039646')).toBe(true);
    expect(isValidTaxId('51705825936')).toBe(true);
    expect(isValidTaxId('47152039620')).toBe(true);
  });
  it('rejects wrong check digit, leading zero, wrong length and frequency', () => {
    expect(isValidTaxId('47152039647')).toBe(false);
    expect(isValidTaxId('01234567888')).toBe(false);
    expect(isValidTaxId('4715203964')).toBe(false);
    expect(isValidTaxId('12345678903')).toBe(false);
    expect(isValidTaxId('55501234786')).toBe(false);
  });
});

describe('taxIdDetector', () => {
  it('reports positions and score', () => {
    expect(taxIdDetector.find('IdNr 47152039646.')).toEqual([
      { type: 'TAX_ID', start: 5, end: 16, value: '47152039646', score: 0.85 },
    ]);
  });
  it('finds compact, space and slash forms', () => {
    expect(values('47152039646, 29 381 075 632 and 51/705/825/936')).toEqual([
      '47152039646',
      '29 381 075 632',
      '51/705/825/936',
    ]);
  });
  it('skips candidates with a wrong check digit or bad digit frequency', () => {
    expect(values('47152039647 29 381 075 631 12345678903')).toEqual([]);
  });
  it('ignores mixed separators, longer runs and glued words', () => {
    expect(values('47 152/039 646 471520396461 X47152039646 47152039646x')).toEqual([]);
  });
  it('skips a grouped tax ID shape behind a phone prefix', () => {
    expect(values('+49 30 47 152 039 646')).toEqual([]);
    expect(values('+49\u00A030\u00A047\u00A0152\u00A0039\u00A0646')).toEqual([]);
    expect(values('+49 47 152 039 646')).toEqual([]);
    expect(values('030 47 152 039 646')).toEqual([]);
  });
  it('still finds a grouped ID next to another digit group, with a lower score', () => {
    const scores = (text: string) => taxIdDetector.find(text).map((m) => [m.value, m.score]);
    expect(scores('47 152 039 646 7')).toEqual([['47 152 039 646', 0.6]]);
    expect(scores('9/47/152/039/646')).toEqual([['47/152/039/646', 0.6]]);
    expect(scores('Kind 2 47 152 039 646')).toEqual([['47 152 039 646', 0.6]]);
    expect(scores('IdNr 47 152 039 646')).toEqual([['47 152 039 646', 0.85]]);
  });
  it('accepts dots and hyphens as group separators', () => {
    expect(values('47.152.039.646 47-152-039-646')).toEqual(['47.152.039.646', '47-152-039-646']);
    expect(values('47.152-039 646')).toEqual([]);
  });
  it('finds a compact ID next to other numbers', () => {
    expect(values('Kind 1 47152039646')).toEqual(['47152039646']);
    expect(values('47152039646 2024')).toEqual(['47152039646']);
    expect(values('2/47152039646/3')).toEqual(['47152039646']);
  });
  it('accepts no-break spaces as group separators', () => {
    expect(values('29\u00A0381\u00A0075\u00A0632 and 64\u202F028\u202F193\u202F529')).toEqual([
      '29\u00A0381\u00A0075\u00A0632',
      '64\u202F028\u202F193\u202F529',
    ]);
    expect(values('29\u00A0381 075\u00A0632')).toEqual([]);
  });
  it('accepts full-width digits and checks them like ASCII digits', () => {
    const fw = (s: string) => s.replace(/\d/g, (d) => String.fromCharCode(0xff10 + Number(d)));
    expect(values(fw('47152039646'))).toEqual([fw('47152039646')]);
    expect(values(fw('29 381 075 632'))).toEqual([fw('29 381 075 632')]);
    expect(values(fw('47152039647'))).toEqual([]);
    expect(values(fw('0') + fw('47152039646'))).toEqual([]);
  });
});

describe('redact with TAX_ID', () => {
  it('round-trips a TAX_ID token', () => {
    const { text, mapping } = redact('Steuer-ID 29 381 075 632.');
    expect(text).toBe('Steuer-ID [TAX_ID_1].');
    expect(restore(text, mapping)).toBe('Steuer-ID 29 381 075 632.');
  });
});
