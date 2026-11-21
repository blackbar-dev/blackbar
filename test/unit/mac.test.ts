import { describe, expect, it } from 'vitest';
import { isUsableMac, macDetector } from '../../src/detectors/mac.js';

const values = (text: string) => macDetector.find(text).map((m) => m.value);

describe('isUsableMac', () => {
  it('rejects all-zero and broadcast in every notation', () => {
    expect(isUsableMac('00:00:00:00:00:00')).toBe(false);
    expect(isUsableMac('FF-FF-FF-FF-FF-FF')).toBe(false);
    expect(isUsableMac('ffff.ffff.ffff')).toBe(false);
    expect(isUsableMac('0000.0000.0000')).toBe(false);
  });
  it('accepts ordinary addresses', () => {
    expect(isUsableMac('00:1a:2b:3c:4d:5e')).toBe(true);
    expect(isUsableMac('001a.2b3c.4d5e')).toBe(true);
  });
});

describe('macDetector', () => {
  it('reports positions', () => {
    expect(macDetector.find('mac 00:1a:2b:3c:4d:5e.')).toEqual([
      { type: 'MAC', start: 4, end: 21, value: '00:1a:2b:3c:4d:5e' },
    ]);
  });
  it('finds colon, dash and dotted forms', () => {
    expect(values('00:1A:2B:3C:4D:5E 00-1a-2b-3c-4d-5e 001a.2b3c.4d5e')).toEqual([
      '00:1A:2B:3C:4D:5E',
      '00-1a-2b-3c-4d-5e',
      '001a.2b3c.4d5e',
    ]);
  });
  it('ignores times, versions, mixed separators and longer runs', () => {
    expect(values('12:34:56 1.2.3.4.5.6 00:1a-2b:3c-4d:5e aa:bb:cc:dd:ee:ff:00')).toEqual([]);
    expect(values('x-aa-bb-cc-dd-ee-ff aa-bb-cc-dd-ee-ff-x 001a.2b3c.4d5e.6f7a')).toEqual([]);
  });
  it('ignores dotted groups made only of digits (build numbers, dates)', () => {
    expect(values('2026.1121.0930')).toEqual([]);
  });
  it('skips broadcast and all-zero matches in running text', () => {
    expect(values('ff:ff:ff:ff:ff:ff 00-00-00-00-00-00 0000.0000.0000')).toEqual([]);
  });
});
