import { describe, expect, it } from 'vitest';
import { type Detector, detect, redact, restore } from '../../src/index.js';

const TEXT =
  'Anna (anna@example.com) zahlt an DE89370400440532013000. Antwort an anna@example.com.';

describe('redact', () => {
  it('replaces findings with stable tokens', () => {
    const result = redact(TEXT);
    expect(result.text).toBe('Anna ([EMAIL_1]) zahlt an [IBAN_1]. Antwort an [EMAIL_1].');
    expect(result.mapping).toEqual({
      '[EMAIL_1]': 'anna@example.com',
      '[IBAN_1]': 'DE89370400440532013000',
    });
    expect(result.entities.map((e) => e.token)).toEqual(['[EMAIL_1]', '[IBAN_1]', '[EMAIL_1]']);
  });

  it('numbers different values of one type', () => {
    expect(redact('a@example.com b@example.com').text).toBe('[EMAIL_1] [EMAIL_2]');
  });

  it('returns the text unchanged when nothing is found', () => {
    expect(redact('Nichts zu sehen.')).toEqual({
      text: 'Nichts zu sehen.',
      entities: [],
      mapping: {},
    });
  });

  it('can be limited to some types', () => {
    expect(redact(TEXT, { types: ['IBAN'] }).text).toContain('anna@example.com');
  });
});

describe('restore', () => {
  it('undoes redact', () => {
    const { text, mapping } = redact(TEXT);
    expect(restore(text, mapping)).toBe(TEXT);
  });

  it('round-trips URL and MAC tokens', () => {
    const input = 'Profile https://example.com/u/anna, device 00:1a:2b:3c:4d:5e.';
    const { text, mapping } = redact(input);
    expect(text).toBe('Profile [URL_1], device [MAC_1].');
    expect(restore(text, mapping)).toBe(input);
  });

  it('leaves unknown tokens alone', () => {
    expect(restore('Hallo [EMAIL_7] und [NAME_1]', {})).toBe('Hallo [EMAIL_7] und [NAME_1]');
  });

  it('does not use inherited object keys', () => {
    expect(restore('[EMAIL_1]', Object.create({ '[EMAIL_1]': 'x' }))).toBe('[EMAIL_1]');
  });
});

describe('detect', () => {
  it('keeps the longer match when two overlap', () => {
    const short: Detector = {
      type: 'IP',
      find: () => [{ type: 'IP', start: 0, end: 3, value: 'abc' }],
    };
    const long: Detector = {
      type: 'CARD',
      find: () => [{ type: 'CARD', start: 1, end: 6, value: 'bcdef' }],
    };
    expect(detect('abcdef', { detectors: [short, long] }).map((m) => m.type)).toEqual(['CARD']);
  });
});
