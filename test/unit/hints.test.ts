import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { type DetectOptions, type Detector, detect, ipDetector } from '../../src/index.js';

const scoreOf = (text: string, options: DetectOptions = {}) => detect(text, options)[0]?.score;

// IP scores 0.7 on its own; a hint adds a fixed 0.2.
const BASE = 0.7;
const HINTED = 0.9;

describe('hint words', () => {
  it('raise the score of a match they precede', () => {
    expect(scoreOf('Abschnitt 1.2.3.4 lesen')).toBeCloseTo(BASE);
    expect(scoreOf('IP 1.2.3.4 sperren')).toBeCloseTo(HINTED);
  });

  it('decide whether a match passes minScore', () => {
    expect(detect('Abschnitt 1.2.3.4 lesen', { minScore: 0.8 })).toEqual([]);
    expect(detect('Server 1.2.3.4 neu starten', { minScore: 0.8 })).toHaveLength(1);
  });

  it('ignore case and spell umlauts either way', () => {
    const opts: DetectOptions = { hints: { IP: ['Prüfgerät', 'Straße'] } };
    expect(scoreOf('PRUEFGERAET 1.2.3.4', opts)).toBeCloseTo(HINTED);
    expect(scoreOf('prüfgerät 1.2.3.4', opts)).toBeCloseTo(HINTED);
    expect(scoreOf('Strasse 1.2.3.4', opts)).toBeCloseTo(HINTED);
    // decomposed ü (u + combining diaeresis) still counts
    expect(scoreOf('Prüfgerät 1.2.3.4', opts)).toBeCloseTo(HINTED);
    // and the built-in "Gerät" hint for MAC matches "Geraet"
    expect(scoreOf('Geraet 00:1a:2b:3c:4d:5e')).toBeCloseTo(HINTED);
  });

  it('match multi-word hints across spaces and hyphens', () => {
    const opts: DetectOptions = { hints: { IP: ['Steuer-ID', 'tax id'] } };
    expect(scoreOf('Steuer ID 1.2.3.4', opts)).toBeCloseTo(HINTED);
    expect(scoreOf('Tax-ID: 1.2.3.4', opts)).toBeCloseTo(HINTED);
    expect(scoreOf('Steuer   -  ID 1.2.3.4', opts)).toBeCloseTo(HINTED);
  });

  it('only match whole words', () => {
    expect(scoreOf('zip 1.2.3.4')).toBeCloseTo(BASE);
    expect(scoreOf('hosting 1.2.3.4')).toBeCloseTo(BASE);
  });

  it('only count inside the window before the match', () => {
    const text = `Server${' '.repeat(20)}1.2.3.4`; // the match starts 26 chars after "Server" begins
    expect(scoreOf(text)).toBeCloseTo(HINTED); // default window is 32
    expect(scoreOf(text, { hintWindow: { before: 26 } })).toBeCloseTo(HINTED);
    expect(scoreOf(text, { hintWindow: { before: 25 } })).toBeCloseTo(BASE);
    expect(scoreOf(text, { hintWindow: { before: 0 } })).toBeCloseTo(BASE);
  });

  it('do not count a word cut in half by the window edge', () => {
    // a window of 3 sees "ip " out of "ship ", which is not the hint "IP"
    expect(scoreOf('ship 1.2.3.4', { hintWindow: { before: 3 } })).toBeCloseTo(BASE);
    expect(scoreOf('s ip 1.2.3.4', { hintWindow: { before: 3 } })).toBeCloseTo(HINTED);
  });

  it('look after the match only when asked to', () => {
    const text = '1.2.3.4 ist der Server';
    expect(scoreOf(text)).toBeCloseTo(BASE);
    expect(scoreOf(text, { hintWindow: { after: 20 } })).toBeCloseTo(HINTED);
    expect(scoreOf(text, { hintWindow: { after: 10 } })).toBeCloseTo(BASE);
  });

  it('raise the score once, however many hints hit, and cap it at 1', () => {
    expect(scoreOf('Server IP host 1.2.3.4')).toBeCloseTo(HINTED);
    expect(scoreOf('IBAN DE89370400440532013000')).toBe(1);
  });

  it('take caller hints per type, next to the built-in ones', () => {
    expect(scoreOf('Router 1.2.3.4')).toBeCloseTo(BASE);
    expect(scoreOf('Router 1.2.3.4', { hints: { IP: ['router'] } })).toBeCloseTo(HINTED);
    expect(scoreOf('Router 1.2.3.4', { hints: { EMAIL: ['router'] } })).toBeCloseTo(BASE);
    expect(scoreOf('Server 1.2.3.4', { hints: { IP: ['router'] } })).toBeCloseTo(HINTED);
    // empty or blank hints never match everything
    expect(scoreOf('x 1.2.3.4', { hints: { IP: ['', '  '] } })).toBeCloseTo(BASE);
  });

  it('treat regex characters in hints literally', () => {
    expect(scoreOf('a.b 1.2.3.4', { hints: { IP: ['a.b'] } })).toBeCloseTo(HINTED);
    expect(scoreOf('axb 1.2.3.4', { hints: { IP: ['a.b'] } })).toBeCloseTo(BASE);
  });

  it('work for custom detectors with their own hints', () => {
    const plz: Detector = {
      type: 'IP',
      hints: ['PLZ', 'Postleitzahl'],
      find: (text) =>
        [...text.matchAll(/\b\d{5}\b/g)].map((m) => ({
          type: 'IP' as const,
          start: m.index,
          end: m.index + 5,
          value: m[0],
          score: 0.3,
        })),
    };
    expect(detect('PLZ 12345', { detectors: [plz], minScore: 0.5 })).toHaveLength(1);
    expect(detect('Seite 12345', { detectors: [plz], minScore: 0.5 })).toEqual([]);
  });

  it('are declared on the built-in detectors', () => {
    expect(ipDetector.hints).toContain('IP-Adresse');
  });
});

interface CorpusCase {
  id: string;
  text: string;
  options?: DetectOptions;
  expected: { type: string; value: string }[];
}

describe('hints corpus', () => {
  const cases: CorpusCase[] = JSON.parse(
    readFileSync(new URL('../corpus/hints.json', import.meta.url), 'utf8'),
  );
  for (const c of cases) {
    it(`${c.id} is found with its options`, () => {
      const found = detect(c.text, c.options).map((m) => ({ type: m.type, value: m.value }));
      expect(found).toEqual(c.expected);
    });
    it(`${c.id} is dropped without the hint`, () => {
      const blind: DetectOptions = { ...c.options, hintWindow: { before: 0, after: 0 } };
      expect(detect(c.text, blind)).toEqual([]);
    });
  }
});
