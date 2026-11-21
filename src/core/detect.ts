import { defaultDetectors } from '../detectors/index.js';
import type { Detector, EntityType, Match } from './types.js';

export interface DetectOptions {
  /** Only look for these types. Default: all built-in detectors. */
  types?: EntityType[];
  /** Replace the built-in detectors entirely. */
  detectors?: Detector[];
  /** Drop matches scoring below this. Default 0: every match is reported. */
  minScore?: number;
}

/**
 * Runs all detectors and returns non-overlapping matches, sorted by position.
 * When two matches overlap, the longer one wins; then the higher score; then the earlier one.
 * Length comes first so a short match can never split a longer one and leave the rest in the text.
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
    .flatMap((d) => d.find(text))
    .map((m) => (Number.isFinite(m.score) ? m : { ...m, score: 1 }))
    .filter((m) => !(minScore > 0) || m.score >= minScore);
  all.sort((a, b) => b.end - b.start - (a.end - a.start) || b.score - a.score || a.start - b.start);

  const kept: Match[] = [];
  for (const m of all) {
    if (!kept.some((k) => m.start < k.end && k.start < m.end)) kept.push(m);
  }
  return kept.sort((a, b) => a.start - b.start);
}
