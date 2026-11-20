import type { Detector } from '../core/types.js';
import { emailDetector } from './email.js';
import { ibanDetector } from './iban.js';

// v0.1 roadmap: phone, card and ip join this list (one file each).
export const defaultDetectors: readonly Detector[] = [emailDetector, ibanDetector];

export { emailDetector, ibanDetector };
