import type { Detector } from '../core/types.js';
import { cardDetector } from './card.js';
import { emailDetector } from './email.js';
import { ibanDetector } from './iban.js';
import { ipDetector } from './ip.js';
import { macDetector } from './mac.js';
import { urlDetector } from './url.js';

// v0.1 roadmap: phone joins this list (one file each).
export const defaultDetectors: readonly Detector[] = [
  emailDetector,
  ibanDetector,
  ipDetector,
  cardDetector,
  urlDetector,
  macDetector,
];

export { cardDetector, emailDetector, ibanDetector, ipDetector, macDetector, urlDetector };
