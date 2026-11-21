import { describe, expect, it } from 'vitest';
import { hasKnownTld, urlDetector } from '../../src/detectors/url.js';
import { detect } from '../../src/index.js';

const values = (text: string) => urlDetector.find(text).map((m) => m.value);

describe('hasKnownTld', () => {
  it('accepts hosts with a listed TLD, any case', () => {
    expect(hasKnownTld('example.com')).toBe(true);
    expect(hasKnownTld('WWW.EXAMPLE.ORG')).toBe(true);
  });
  it('rejects unknown TLDs, bare names, IPs and bad labels', () => {
    expect(hasKnownTld('example.notatld')).toBe(false);
    expect(hasKnownTld('localhost')).toBe(false);
    expect(hasKnownTld('192.0.2.1')).toBe(false);
    expect(hasKnownTld('-bad.example.com')).toBe(false);
    expect(hasKnownTld('a..example.com')).toBe(false);
    expect(hasKnownTld('')).toBe(false);
  });
});

describe('urlDetector', () => {
  it('reports positions', () => {
    expect(urlDetector.find('at https://example.com/x.')).toEqual([
      { type: 'URL', start: 3, end: 24, value: 'https://example.com/x' },
    ]);
  });
  it('accepts http, https, ftp and www.', () => {
    expect(
      values('http://example.com https://example.org ftp://example.net www.example.de'),
    ).toEqual(['http://example.com', 'https://example.org', 'ftp://example.net', 'www.example.de']);
  });
  it('strips sentence punctuation but keeps balanced brackets', () => {
    expect(values('(see https://example.com/a_(b))')).toEqual(['https://example.com/a_(b)']);
    expect(values('[https://example.com/x]')).toEqual(['https://example.com/x']);
    expect(values('https://example.com/q?a[0]=1')).toEqual(['https://example.com/q?a[0]=1']);
    expect(values('"https://example.com/x";')).toEqual(['https://example.com/x']);
  });
  it('handles userinfo and ports in the host part', () => {
    expect(values('https://anna@example.com:8443/')).toEqual(['https://anna@example.com:8443/']);
    expect(values('https://example.com:abc/')).toEqual([]);
  });
  it('ignores bare schemes, unknown TLDs, IP hosts and glued prefixes', () => {
    expect(values('https:// www. http://localhost http://192.0.2.1/ xhttps://example.com')).toEqual(
      [],
    );
    expect(values('awww.example.com anna@www.example.com')).toEqual([]);
  });
  it('wins over an e-mail address inside it', () => {
    expect(detect('go https://example.com/?to=anna@example.com now')).toEqual([
      { type: 'URL', start: 3, end: 43, value: 'https://example.com/?to=anna@example.com' },
    ]);
  });
});
