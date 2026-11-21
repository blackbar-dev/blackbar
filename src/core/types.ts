/** Kinds of personal data Blackbar can detect. v0.1 target: EMAIL, PHONE, IBAN, CARD, IP, URL, MAC. */
export type EntityType = 'EMAIL' | 'PHONE' | 'IBAN' | 'CARD' | 'IP' | 'URL' | 'MAC';

/** One finding in a text. `start` is inclusive, `end` is exclusive (like String.prototype.slice). */
export interface Match {
  type: EntityType;
  start: number;
  end: number;
  value: string;
  /** Confidence from 0 to 1. Checksum-validated formats score high, pattern-only formats lower. */
  score: number;
}

/** A detector finds one kind of personal data. One file per detector in src/detectors/. */
export interface Detector {
  type: EntityType;
  find(text: string): Match[];
}
