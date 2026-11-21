import type { Detector, Match } from '../core/types.js';

// Four dotted groups of digits. The lookarounds keep us out of version strings ("v1.2.3.4"),
// longer dotted numbers ("1.2.3.4.5") and words. A trailing sentence period is fine.
const IPV4 = /(?<![\w.])\d{1,3}(?:\.\d{1,3}){3}(?!\w|\.\d)/g;

// Anything made of hex digits, colons and dots; validated structurally afterwards.
const IPV6_CANDIDATE = /(?<![\w:.])[0-9A-Fa-f:.]*:[0-9A-Fa-f:.]*/g;

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
  if (halves.length === 2) return groups.length > 0 && count <= 7;
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
    matches.push({ type: 'IP', start: m.index, end: m.index + value.length, value });
  }
  return matches;
}

export const ipDetector: Detector = {
  type: 'IP',
  find(text: string): Match[] {
    const matches = findIpv6(text);
    for (const m of text.matchAll(IPV4)) {
      if (!isValidIpv4(m[0])) continue;
      const start = m.index;
      const end = start + m[0].length;
      // Skip IPv4 tails already covered by an IPv6 match.
      if (matches.some((v) => start < v.end && end > v.start)) continue;
      matches.push({ type: 'IP', start, end, value: m[0] });
    }
    return matches.sort((a, b) => a.start - b.start);
  },
};
