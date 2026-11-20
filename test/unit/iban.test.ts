import { describe, expect, it } from 'vitest';
import { ibanDetector, isValidIban } from '../../src/detectors/iban.js';

const VALID = [
  'DE89370400440532013000',
  'GB82WEST12345698765432',
  'FR1420041010050500013M02606',
  'NL91ABNA0417164300',
  'CH9300762011623852957',
  'AT611904300234573201',
  'BE68539007547034',
  'ES9121000418450200051332',
  'IT60X0542811101000000123456',
  'NO9386011117947',
  'PL61109010140000071219812874',
];

const values = (text: string) => ibanDetector.find(text).map((m) => m.value);

describe('isValidIban', () => {
  it.each(VALID)('accepts %s', (iban) => {
    expect(isValidIban(iban)).toBe(true);
  });

  it('accepts the printed form with spaces and lower case', () => {
    expect(isValidIban('DE89 3704 0044 0532 0130 00')).toBe(true);
    expect(isValidIban('gb82 west 1234 5698 7654 32')).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    expect(isValidIban('DE88370400440532013000')).toBe(false);
  });

  it('rejects a wrong length for the country', () => {
    expect(isValidIban('DE8937040044053201300')).toBe(false);
  });

  it('rejects unknown countries and junk', () => {
    expect(isValidIban('XX89370400440532013000')).toBe(false);
    expect(isValidIban('DE89-3704-0044-0532-0130-00')).toBe(false);
  });
});

describe('ibanDetector', () => {
  it('finds a compact IBAN with its position', () => {
    const text = 'Bitte an DE89370400440532013000 überweisen.';
    expect(ibanDetector.find(text)).toEqual([
      { type: 'IBAN', start: 9, end: 31, value: 'DE89370400440532013000' },
    ]);
  });

  it('finds the spaced form and stops before the next word', () => {
    expect(values('IBAN: DE89 3704 0044 0532 0130 00 und danke')).toEqual([
      'DE89 3704 0044 0532 0130 00',
    ]);
    expect(values('Konto BE68 5390 0754 7034 test')).toEqual(['BE68 5390 0754 7034']);
  });

  it('finds several IBANs', () => {
    expect(values('GB82WEST12345698765432 or NL91ABNA0417164300.')).toEqual([
      'GB82WEST12345698765432',
      'NL91ABNA0417164300',
    ]);
  });

  it('ignores look-alikes', () => {
    expect(values('Order DE88370400440532013000 failed')).toEqual([]); // bad checksum
    expect(values('ID xDE89370400440532013000')).toEqual([]); // glued to a word
    expect(values('Version DE12 is out')).toEqual([]);
  });
});
