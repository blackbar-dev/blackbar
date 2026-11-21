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
 * When two matches overlap, the higher score wins; then the longer one; then the earlier one.
 */
export function detect(text: string, options: DetectOptions = {}): Match[] {
  const { minScore = 0 } = options;
  const detectors = (options.detectors ?? defaultDetectors).filter(
    (d) => !options.types || options.types.includes(d.type),
  );
  const all = detectors.flatMap((d) => d.find(text)).filter((m) => m.score >= minScore);
  all.sort((a, b) => b.score - a.score || b.end - b.start - (a.end - a.start) || a.start - b.start);

  const kept: Match[] = [];
  for (const m of all) {
    if (!kept.some((k) => m.start < k.end && k.start < m.end)) kept.push(m);
  }
  return kept.sort((a, b) => a.start - b.start);
}
