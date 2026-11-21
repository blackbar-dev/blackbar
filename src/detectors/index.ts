import type { Detector } from '../core/types.js';
import { cardDetector } from './card.js';
import { emailDetector } from './email.js';
import { ibanDetector } from './iban.js';
import { ipDetector } from './ip.js';

// v0.1 roadmap: phone joins this list (one file each).
export const defaultDetectors: readonly Detector[] = [
  emailDetector,
  ibanDetector,
  ipDetector,
  cardDetector,
];

export { cardDetector, emailDetector, ibanDetector, ipDetector };
