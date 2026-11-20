/** Kinds of personal data Blackbar can detect. v0.1 target: EMAIL, PHONE, IBAN, CARD, IP. */
export type EntityType = 'EMAIL' | 'PHONE' | 'IBAN' | 'CARD' | 'IP';

/** One finding in a text. `start` is inclusive, `end` is exclusive (like String.prototype.slice). */
export interface Match {
  type: EntityType;
  start: number;
  end: number;
  value: string;
}

/** A detector finds one kind of personal data. One file per detector in src/detectors/. */
export interface Detector {
  type: EntityType;
  find(text: string): Match[];
}
