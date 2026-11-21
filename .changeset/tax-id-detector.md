---
'blackbar': minor
---

New TAX_ID detector for the German tax ID (Steuerliche Identifikationsnummer): 11 digits, compact or in 2-3-3-3 groups split by spaces, slashes, hyphens or no-break spaces (U+00A0, U+202F), one kind per ID; full-width digits are accepted too. Requires the BZSt digit-frequency rule and a valid ISO 7064 MOD 11,10 check digit. New token `[TAX_ID_n]`, score 0.85, or 0.6 when another digit group sits right next to a grouped ID (still redacted, so a number in front cannot hide it).
