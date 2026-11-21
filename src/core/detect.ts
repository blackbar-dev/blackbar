import { defaultDetectors } from '../detectors/index.js';
import { applyHints, compileHints, type HintWindow } from './hints.js';
import type { Detector, EntityType, Match } from './types.js';

export interface DetectOptions {
  /** Only look for these types. Default: all built-in detectors. */
  types?: EntityType[];
  /** Replace the built-in detectors entirely. */
  detectors?: Detector[];
  /** Drop matches scoring below this. Default 0: every match is reported. */
  minScore?: number;
  /**
   * Extra hint words per type, on top of each detector's own. A hint near a match raises its
   * score by `HINT_STEP` (once, capped at 1). Case, umlaut spelling (ü/ue, ß/ss) and
   * spaces vs. hyphens do not matter; hints match whole words only.
   */
  hints?: Partial<Record<EntityType, readonly string[]>>;
  /** Where to look for hints. Default: 32 characters before the match, none after. */
  hintWindow?: HintWindow;
}

// Detectors are long-lived, so their own hints are compiled once.
const builtInHints = new WeakMap<Detector, RegExp | undefined>();

function hintsFor(d: Detector, extra: readonly string[] | undefined): RegExp | undefined {
  if (extra?.length) return compileHints([...(d.hints ?? []), ...extra]);
  if (!builtInHints.has(d)) builtInHints.set(d, compileHints(d.hints ?? []));
  return builtInHints.get(d);
}

function findScored(d: Detector, text: string, options: DetectOptions): Match[] {
  const re = hintsFor(d, options.hints?.[d.type]);
  return d
    .find(text)
    .map((m) => (Number.isFinite(m.score) ? m : { ...m, score: 1 }))
    .map((m) => (re ? applyHints(text, m, re, options.hintWindow) : m));
}

/**
 * Runs all detectors and returns non-overlapping matches, sorted by position.
 * When two matches overlap, the longer one wins; then the higher score; then the earlier one.
 * Length comes first so a short match can never split a longer one and leave the rest in the text.
 * A match fully inside the winner is dropped. A match that only partly overlaps is one finding
 * with the winner: the winner keeps its type and score but grows to cover both spans, and its
 * value becomes that text. Otherwise the part sticking out would stay in the text unredacted.
 */
export function detect(text: string, options: DetectOptions = {}): Match[] {
  const { minScore = 0 } = options;
  const detectors = (options.detectors ?? defaultDetectors).filter(
    (d) => !options.types || options.types.includes(d.type),
  );
  // A match without a numeric score (detector from before scores, plain JS) counts as certain:
  // dropping it silently would leave the data in the text. Only filter when asked to, so
  // a NaN minScore cannot drop everything either.
  const all = detectors
    .flatMap((d) => findScored(d, text, options))
    .filter((m) => !(minScore > 0) || m.score >= minScore);
  all.sort((a, b) => b.end - b.start - (a.end - a.start) || b.score - a.score || a.start - b.start);

  // `kept` stays in rank order and disjoint, so the first overlapping entry is the winner.
  // Folding m and every kept span it touches into one leaves no partial overlap behind.
  let kept: Match[] = [];
  for (const m of all) {
    const hits = kept.filter((k) => m.start < k.end && k.start < m.end);
    const winner = hits[0];
    if (!winner) {
      kept.push(m);
      continue;
    }
    const start = Math.min(m.start, ...hits.map((k) => k.start));
    const end = Math.max(m.end, ...hits.map((k) => k.end));
    if (start === winner.start && end === winner.end) continue;
    const grown = { ...winner, start, end, value: text.slice(start, end) };
    kept = kept
      .filter((k) => !hits.includes(k) || k === winner)
      .map((k) => (k === winner ? grown : k));
  }
  return kept.sort((a, b) => a.start - b.start);
}
