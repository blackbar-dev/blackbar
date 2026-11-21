---
'blackbar': minor
---

New TAX_ID detector for the German tax ID (Steuerliche Identifikationsnummer): 11 digits, compact or in 2-3-3-3 groups split by spaces, slashes or no-break spaces (U+00A0, U+202F); full-width digits are accepted too. Requires the BZSt digit-frequency rule and a valid ISO 7064 MOD 11,10 check digit. New token `[TAX_ID_n]`, score 0.85.
