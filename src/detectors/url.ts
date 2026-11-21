import type { Detector, Match } from '../core/types.js';

// A scheme (http, https, ftp) or "www." followed by anything that is not whitespace or a
// character that never appears unescaped in a URL. The lookbehind keeps us out of words
// ("xhttps://", "awww.") and out of e-mail domains ("anna@www.example.com").
const CANDIDATE = /(?<![\w@./-])(?:(?:https?|ftp):\/\/|www\.)[^\s<>"'`{}|\\^]*/gi;
const SCHEME = /^(?:https?|ftp):\/\//i;
const LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';
const HOST = new RegExp(String.raw`^(?:${LABEL}\.)+([a-z]{2,63})$`, 'i');

// Pattern plus TLD check, no checksum. The scheme or "www." is as strong a signal as the "@" in
// an e-mail address, so the same score as EMAIL.
const SCORE = 0.8;

// A short list of TLDs we wrote ourselves. Without it "www.backup.tar.gz" would be a link.
// Common generic TLDs plus the larger country codes; extend when the corpus asks for it.
// biome-ignore format: compact list is easier to scan
const TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro',
  'io', 'ai', 'app', 'dev', 'co', 'me', 'tv', 'cc', 'xyz', 'online', 'site', 'tech',
  'blog', 'shop', 'store', 'cloud', 'page', 'link', 'news', 'email', 'zip', 'mov',
  'eu', 'us', 'uk', 'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'pl', 'cz', 'sk',
  'se', 'no', 'dk', 'fi', 'is', 'ie', 'pt', 'gr', 'hu', 'ro', 'bg', 'hr', 'si', 'lt',
  'lv', 'ee', 'lu', 'ua', 'ru', 'tr', 'il', 'jp', 'cn', 'kr', 'tw', 'hk', 'sg', 'in',
  'id', 'th', 'vn', 'ph', 'my', 'au', 'nz', 'ca', 'mx', 'br', 'ar', 'cl', 'pe', 'za',
]);

/** Host made of valid labels whose last label is in our TLD list. */
export function hasKnownTld(host: string): boolean {
  const m = HOST.exec(host);
  return m?.[1] !== undefined && TLDS.has(m[1].toLowerCase());
}

const count = (s: string, ch: string) => s.split(ch).length - 1;
const SENTENCE_PUNCT = new Set(['.', ',', ';', ':', '!', '?']);

// Sentence punctuation after a link belongs to the sentence. A closing bracket only belongs to
// the URL when it closes one opened inside it ("…/wiki/Foo_(bar)" vs "(see https://…/a)").
// The input is untrusted, so we count the brackets once and adjust the counts while trimming:
// recounting per stripped character was O(n²) on a URL followed by a long run of ")".
function trimTrailing(value: string): string {
  // Surplus of closing over opening brackets; each stripped closer uses up one.
  let parens = count(value, ')') - count(value, '(');
  let squares = count(value, ']') - count(value, '[');
  let end = value.length;
  while (end > 0) {
    const last = value.charAt(end - 1);
    if (last === ')' && parens > 0) parens--;
    else if (last === ']' && squares > 0) squares--;
    else if (!SENTENCE_PUNCT.has(last)) break;
    end--;
  }
  return value.slice(0, end);
}

function hostOf(url: string): string {
  const authority = url.replace(SCHEME, '').split(/[/?#]/, 1)[0] ?? '';
  // Drop userinfo ("anna@") and a numeric port.
  return authority.slice(authority.lastIndexOf('@') + 1).replace(/:\d*$/, '');
}

export const urlDetector: Detector = {
  type: 'URL',
  hints: ['URL', 'Link', 'Webseite', 'Website', 'Homepage', 'Web-Adresse', 'web address'],
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(CANDIDATE)) {
      const value = trimTrailing(m[0]);
      // A trailing dot on the host ("example.com.") is valid DNS, so ignore it for the TLD check.
      if (!hasKnownTld(hostOf(value).replace(/\.$/, ''))) continue;
      matches.push({
        type: 'URL',
        start: m.index,
        end: m.index + value.length,
        value,
        score: SCORE,
      });
    }
    return matches;
  },
};
