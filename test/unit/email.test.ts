import { describe, expect, it } from 'vitest';
import { emailDetector } from '../../src/detectors/email.js';

const values = (text: string) => emailDetector.find(text).map((m) => m.value);

describe('emailDetector', () => {
  it('finds an address with its position', () => {
    expect(emailDetector.find('Mail an anna@example.com bitte')).toEqual([
      { type: 'EMAIL', start: 8, end: 24, value: 'anna@example.com', score: 0.8 },
    ]);
  });

  it('handles dots, plus tags, subdomains and long TLDs', () => {
    expect(values('max.mustermann+news@mail.example.co.uk')).toEqual([
      'max.mustermann+news@mail.example.co.uk',
    ]);
    expect(values('hi@studio.photography')).toEqual(['hi@studio.photography']);
  });

  it('leaves out punctuation around the address', () => {
    expect(values('(anna@example.com), <bob@example.org>.')).toEqual([
      'anna@example.com',
      'bob@example.org',
    ]);
    expect(values('Schreib an anna@example.com.')).toEqual(['anna@example.com']);
  });

  it('finds several addresses', () => {
    expect(values('a@example.com;b@example.com')).toEqual(['a@example.com', 'b@example.com']);
  });

  it('ignores things that are not addresses', () => {
    expect(values('@handle and user@ and @example.com')).toEqual([]);
    expect(values('anna@localhost')).toEqual([]);
    expect(values('anna@example.c')).toEqual([]);
    expect(values('bad..dots@example.com')).toEqual([]);
    expect(values('anna@-example.com')).toEqual([]);
  });

  it('ignores file names that look like addresses', () => {
    expect(values('bericht@2026.pdf')).toEqual([]);
    expect(values('logo@2x.png scan@300dpi.jpg')).toEqual([]);
    expect(values('Logo@2X.PNG')).toEqual([]);
    expect(values('mail anna@example.com and logo@2x.png')).toEqual(['anna@example.com']);
  });

  it('skips addresses with an over-long local part', () => {
    expect(values(`${'a'.repeat(65)}@example.com`)).toEqual([]);
  });
});
