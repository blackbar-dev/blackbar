import type { Match } from './types.js';

/** How far `detect` looks for hint words around a match, in characters of the original text. */
export interface HintWindow {
  /** Characters before the match. Default 32. */
  before?: number;
  /** Characters after the match. Default 0: hints usually come first ("IBAN: …"). */
  after?: number;
}

/** Added once per match when any hint is in the window. The score is capped at 1. */
export const HINT_STEP = 0.2;

const DEFAULT_BEFORE = 32;

/**
 * Folds text so "Prüfgerät", "PRUEFGERAET" and "Steuer - ID" compare equal to their plain forms.
 * NFC first so a decomposed "u" plus diaeresis becomes ü before we map it.
 */
export function normalizeHint(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[\s\-‐‑–—_]+/g, ' ');
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One regex for all hints of a type, or undefined when there is nothing to look for. */
export function compileHints(hints: readonly string[]): RegExp | undefined {
  const words = hints.map((h) => normalizeHint(h).trim()).filter(Boolean);
  if (words.length === 0) return undefined;
  // Whole words only: "ip" must not hit "zip" or "ship".
  return new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${words.map(escapeRegex).join('|')})(?![\\p{L}\\p{N}])`,
    'u',
  );
}

const WORD = /[\p{L}\p{N}\p{M}]/u;
const isWord = (c: string | undefined) => c !== undefined && WORD.test(c);

/**
 * Raises the score when a hint sits in the window around the match.
 * A word cut in half at the outer edge of the window ("sh|ip") is dropped, so its tail
 * cannot pass for a hint. The match side counts as a boundary: "IBAN:DE89…" still hits.
 */
export function applyHints(text: string, m: Match, re: RegExp, window: HintWindow = {}): Match {
  const before = Math.max(0, window.before ?? DEFAULT_BEFORE) || 0;
  const after = Math.max(0, window.after ?? 0) || 0;
  const from = Math.max(0, m.start - before);
  const to = Math.min(text.length, m.end + after);
  let pre = text.slice(from, m.start);
  if (isWord(text[from - 1])) pre = pre.replace(/^[\p{L}\p{N}\p{M}]+/u, '');
  let post = text.slice(m.end, to);
  if (isWord(text[to])) post = post.replace(/[\p{L}\p{N}\p{M}]+$/u, '');
  if (!re.test(normalizeHint(pre)) && !re.test(normalizeHint(post))) return m;
  return { ...m, score: Math.min(1, m.score + HINT_STEP) };
}
