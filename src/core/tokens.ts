import type { EntityType } from './types.js';

/** Maps placeholder tokens such as `[EMAIL_1]` back to the original values. */
export type Mapping = Record<string, string>;

export const TOKEN_PATTERN = /\[(EMAIL|PHONE|IBAN|CARD|IP|URL|MAC|TAX_ID)_(\d+)\]/g;

/**
 * Hands out stable placeholder tokens: the same value always gets the same token
 * within one call to `redact`, so `[EMAIL_1]` written twice means the same person.
 */
export class TokenRegistry {
  readonly #byValue = new Map<string, string>();
  readonly #counters = new Map<EntityType, number>();
  readonly mapping: Mapping = {};

  tokenFor(type: EntityType, value: string): string {
    const key = `${type}\u0000${value}`;
    const existing = this.#byValue.get(key);
    if (existing) return existing;
    const n = (this.#counters.get(type) ?? 0) + 1;
    this.#counters.set(type, n);
    const token = `[${type}_${n}]`;
    this.#byValue.set(key, token);
    this.mapping[token] = value;
    return token;
  }
}
