import type { Detector, Match } from '../core/types.js';

// Four dotted groups of digits. The lookarounds keep us out of version strings ("v1.2.3.4"),
// longer dotted numbers ("1.2.3.4.5") and words. A trailing sentence period is fine.
const IPV4 = /(?<![\w.])\d{1,3}(?:\.\d{1,3}){3}(?!\w|\.\d)/g;

// Anything made of hex digits, colons and dots; validated structurally afterwards.
// Eight hex groups are a valid IPv6 even when they look like an EUI-64 or hardware ID
// ("aa:bb:cc:dd:ee:ff:00:11"). We keep that as IP on purpose: recall first. The text has
// no way to tell an interface ID from a full-form address, and the ID is personal data
// as well, so a wrong label is cheaper than a leak. (Six groups go to the MAC detector.)
const IPV6_CANDIDATE = /(?<![\w:.])[0-9A-Fa-f:.]*:[0-9A-Fa-f:.]*/g;

// Structure check only (octet ranges, group counts), no checksum. Dotted version numbers and
// section numbers like "1.2.3.4" pass it, so the lowest built-in score.
const SCORE = 0.7;

/** Four octets 0-255 without leading zeros ("010" is ambiguous: octal in some parsers). */
export function isValidIpv4(s: string): boolean {
  const octets = s.split('.');
  return (
    octets.length === 4 && octets.every((o) => /^(0|[1-9]\d{0,2})$/.test(o) && Number(o) <= 255)
  );
}

/** Full, compressed (at most one "::") and IPv4-tail forms. */
export function isValidIpv6(s: string): boolean {
  const halves = s.split('::');
  if (halves.length > 2) return false;
  const groups = halves.flatMap((h) => (h === '' ? [] : h.split(':')));
  let count = groups.length;
  const last = groups[groups.length - 1];
  // An embedded IPv4 tail ("::ffff:192.0.2.1") is only allowed at the very end and counts as two groups.
  if (last?.includes('.')) {
    if (!isValidIpv4(last) || halves[halves.length - 1] === '') return false;
    groups.pop();
    count += 1;
  }
  if (!groups.every((g) => /^[0-9A-Fa-f]{1,4}$/.test(g))) return false;
  if (halves.length === 2) return count > 0 && count <= 7;
  return count === 8;
}

function findIpv6(text: string): Match[] {
  const matches: Match[] = [];
  for (const m of text.matchAll(IPV6_CANDIDATE)) {
    // Sentence punctuation may cling to the end ("... is 2001:db8::1."). Peel it off.
    let value = m[0];
    while (value && !isValidIpv6(value) && /[.:]$/.test(value)) value = value.slice(0, -1);
    if (!value || !isValidIpv6(value)) continue;
    const next = text[m.index + value.length];
    if (next !== undefined && /\w/.test(next)) continue;
    matches.push({ type: 'IP', start: m.index, end: m.index + value.length, value, score: SCORE });
  }
  return matches;
}

export const ipDetector: Detector = {
  type: 'IP',
  hints: ['IP', 'IP-Adresse', 'IP address', 'IPv4', 'IPv6', 'Server', 'Host'],
  find(text: string): Match[] {
    const matches = findIpv6(text);
    for (const m of text.matchAll(IPV4)) {
      if (!isValidIpv4(m[0])) continue;
      const start = m.index;
      const end = start + m[0].length;
      // Skip IPv4 tails already covered by an IPv6 match. An IPv4 inside a *rejected* IPv6
      // candidate ("2001:db8::192.0.2.4:5") is still reported: the dotted part is a valid
      // address on its own, and dropping it would leave it in the text. Recall first.
      if (matches.some((v) => start < v.end && end > v.start)) continue;
      matches.push({ type: 'IP', start, end, value: m[0], score: SCORE });
    }
    return matches.sort((a, b) => a.start - b.start);
  },
};
