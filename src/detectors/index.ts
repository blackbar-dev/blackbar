import type { Detector } from '../core/types.js';
import { emailDetector } from './email.js';
import { ibanDetector } from './iban.js';
import { ipDetector } from './ip.js';

// v0.1 roadmap: phone and card join this list (one file each).
export const defaultDetectors: readonly Detector[] = [emailDetector, ibanDetector, ipDetector];

export { emailDetector, ibanDetector, ipDetector };
