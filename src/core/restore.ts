import { type Mapping, TOKEN_PATTERN } from './tokens.js';

/**
 * Puts the original values back. Tokens that are not in the mapping stay as they are,
 * so a text that went through an LLM and came back can be restored safely.
 */
export function restore(text: string, mapping: Mapping): string {
  return text.replace(TOKEN_PATTERN, (token) =>
    Object.hasOwn(mapping, token) ? (mapping[token] as string) : token,
  );
}
