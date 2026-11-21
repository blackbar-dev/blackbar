import { describe, expect, it } from 'vitest';
import {
  type DetectOptions,
  type Detector,
  detect,
  type EntityType,
  redact,
  restore,
} from '../../src/index.js';

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

  it('leaves matches below minScore in the text', () => {
    expect(redact(TEXT, { minScore: 0.9 }).text).toBe(
      'Anna (anna@example.com) zahlt an [IBAN_1]. Antwort an anna@example.com.',
    );
  });
});

describe('restore', () => {
  it('undoes redact', () => {
    const { text, mapping } = redact(TEXT);
    expect(restore(text, mapping)).toBe(TEXT);
  });

  it('leaves unknown tokens alone', () => {
    expect(restore('Hallo [EMAIL_7] und [NAME_1]', {})).toBe('Hallo [EMAIL_7] und [NAME_1]');
  });

  it('does not use inherited object keys', () => {
    expect(restore('[EMAIL_1]', Object.create({ '[EMAIL_1]': 'x' }))).toBe('[EMAIL_1]');
  });
});

describe('detect', () => {
  // A detector that returns exactly the given spans, to test overlap resolution in isolation.
  const fixed = (type: EntityType, ...spans: [number, number, number][]): Detector => ({
    type,
    find: (text) =>
      spans.map(([start, end, score]) => ({
        type,
        start,
        end,
        value: text.slice(start, end),
        score,
      })),
  });
  const types = (text: string, options: DetectOptions) => detect(text, options).map((m) => m.type);

  it('gives every built-in match a score between 0 and 1', () => {
    const text = `${TEXT} Karte 4111 1111 1111 1111 von 192.0.2.1`;
    const matches = detect(text);
    expect(matches.map((m) => m.type)).toEqual(['EMAIL', 'IBAN', 'EMAIL', 'CARD', 'IP']);
    for (const m of matches) {
      expect(m.score).toBeGreaterThan(0);
      expect(m.score).toBeLessThanOrEqual(1);
    }
  });

  it('ranks checksum formats above pattern-only formats', () => {
    const score = (text: string) => detect(text)[0]?.score ?? 0;
    const iban = score('DE89370400440532013000');
    const card = score('4111111111111111');
    const email = score('anna@example.com');
    const ip = score('192.0.2.1');
    expect(iban).toBeGreaterThan(card);
    expect(card).toBeGreaterThan(email);
    expect(email).toBeGreaterThan(ip);
  });

  it('drops matches below minScore', () => {
    const detectors = [fixed('IP', [0, 3, 0.3]), fixed('CARD', [4, 6, 0.9])];
    expect(types('abc de', { detectors })).toEqual(['IP', 'CARD']);
    expect(types('abc de', { detectors, minScore: 0.5 })).toEqual(['CARD']);
  });

  it('keeps a match whose score equals minScore', () => {
    expect(types('abc', { detectors: [fixed('IP', [0, 3, 0.5])], minScore: 0.5 })).toEqual(['IP']);
  });

  it('reports every match by default, however low its score', () => {
    expect(types('abc', { detectors: [fixed('IP', [0, 3, 0])] })).toEqual(['IP']);
  });

  it('keeps the higher score when two overlap, even if it is shorter', () => {
    const detectors = [fixed('IP', [0, 6, 0.5]), fixed('CARD', [1, 3, 0.9])];
    expect(types('abcdef', { detectors })).toEqual(['CARD']);
  });

  it('keeps the longer match when two overlap with equal score', () => {
    const detectors = [fixed('IP', [0, 3, 0.8]), fixed('CARD', [1, 6, 0.8])];
    expect(types('abcdef', { detectors })).toEqual(['CARD']);
  });

  it('keeps the earlier match when score and length are equal', () => {
    const detectors = [fixed('CARD', [1, 4, 0.8]), fixed('IP', [0, 3, 0.8])];
    expect(types('abcdef', { detectors })).toEqual(['IP']);
  });
});
