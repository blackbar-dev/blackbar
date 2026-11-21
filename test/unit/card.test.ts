import { describe, expect, it } from 'vitest';
import { cardDetector, isValidCard, luhn } from '../../src/detectors/card.js';

const values = (text: string) => cardDetector.find(text).map((m) => m.value);

describe('luhn', () => {
  it('accepts valid and rejects invalid checksums', () => {
    expect(luhn('4111111111111111')).toBe(true);
    expect(luhn('4111111111111112')).toBe(false);
  });
});

describe('isValidCard', () => {
  it('accepts published test numbers of each issuer', () => {
    for (const n of [
      '4111111111111111',
      '4222222222222',
      '5555555555554444',
      '2223003122003222',
      '378282246310005',
      '6011111111111117',
      '3530111333300000',
      '30569309025904',
      '6759649826438453',
    ]) {
      expect(isValidCard(n), n).toBe(true);
    }
  });
  it('rejects unknown prefixes and wrong lengths even with a valid checksum', () => {
    expect(isValidCard('1234567812345670')).toBe(false);
    expect(isValidCard('411111111111111')).toBe(false);
  });
});

describe('cardDetector', () => {
  it('finds compact and grouped numbers with offsets', () => {
    const text = 'a 4111 1111 1111 1111 b';
    expect(cardDetector.find(text)).toEqual([
      { type: 'CARD', start: 2, end: 21, value: '4111 1111 1111 1111' },
    ]);
  });
  it('finds hyphenated numbers and keeps the trailing period outside', () => {
    expect(values('4111-1111-1111-1111.')).toEqual(['4111-1111-1111-1111']);
  });
  it('rejects mixed separators', () => {
    expect(values('4111 1111-1111 1111')).toEqual([]);
  });
  it('ignores numbers inside a longer digit run', () => {
    expect(values('04111111111111111')).toEqual([]);
    expect(values('41111111111111111')).toEqual([]);
  });
  it('finds two cards separated by a space', () => {
    expect(values('4111111111111111 5105105105105100')).toEqual([
      '4111111111111111',
      '5105105105105100',
    ]);
  });
  it('finds a card after a short number', () => {
    expect(cardDetector.find('Order 12 4111111111111111')).toEqual([
      { type: 'CARD', start: 9, end: 25, value: '4111111111111111' },
    ]);
  });
  it('finds a grouped card after a short number with the same separator', () => {
    expect(values('ref 12 4111 1111 1111 1111')).toEqual(['4111 1111 1111 1111']);
  });
  it('ignores timestamps and order numbers', () => {
    expect(values('1700000000000 and 1234567890123')).toEqual([]);
  });
});
