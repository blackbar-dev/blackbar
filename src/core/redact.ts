import { type DetectOptions, detect } from './detect.js';
import { type Mapping, TokenRegistry } from './tokens.js';
import type { EntityType } from './types.js';

export interface RedactedEntity {
  type: EntityType;
  token: string;
  /** Position in the original text. */
  start: number;
  end: number;
}

export interface RedactResult {
  /** The text with every finding replaced by a token such as `[EMAIL_1]`. */
  text: string;
  entities: RedactedEntity[];
  /** Token to original value. Keep it secret: it is the key to undo the redaction. */
  mapping: Mapping;
}

export type RedactOptions = DetectOptions;

export function redact(text: string, options: RedactOptions = {}): RedactResult {
  const matches = detect(text, options);
  const registry = new TokenRegistry();
  const entities: RedactedEntity[] = [];
  let out = '';
  let cursor = 0;

  for (const m of matches) {
    const token = registry.tokenFor(m.type, m.value);
    out += text.slice(cursor, m.start) + token;
    cursor = m.end;
    entities.push({ type: m.type, token, start: m.start, end: m.end });
  }
  out += text.slice(cursor);

  return { text: out, entities, mapping: registry.mapping };
}
