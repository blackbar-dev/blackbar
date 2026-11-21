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

// Sentence punctuation after a link belongs to the sentence. A closing bracket only belongs to
// the URL when it closes one opened inside it ("…/wiki/Foo_(bar)" vs "(see https://…/a)").
function trimTrailing(value: string): string {
  let v = value;
  for (;;) {
    const last = v.at(-1) ?? '';
    const open = last === ')' ? '(' : last === ']' ? '[' : '';
    if (/[.,;:!?]/.test(last) || (open && count(v, open) < count(v, last))) v = v.slice(0, -1);
    else return v;
  }
}

function hostOf(url: string): string {
  const authority = url.replace(SCHEME, '').split(/[/?#]/, 1)[0] ?? '';
  // Drop userinfo ("anna@") and a numeric port.
  return authority.slice(authority.lastIndexOf('@') + 1).replace(/:\d*$/, '');
}

export const urlDetector: Detector = {
  type: 'URL',
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(CANDIDATE)) {
      const value = trimTrailing(m[0]);
      if (!hasKnownTld(hostOf(value))) continue;
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
