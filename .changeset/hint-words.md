---
'blackbar': minor
---

Hint words near a match raise its score by `HINT_STEP` (0.2, capped at 1). Built-in detectors declare German and English hints (`IBAN`, `Kontonummer`, `IP-Adresse`, …); custom detectors can set `hints` too. `detect` and `redact` accept `hints` per type and a `hintWindow` (default: 32 characters before the match, none after). Matching ignores case, umlaut spelling (`ü`/`ue`, `ß`/`ss`) and spaces vs. hyphens, and only counts whole words. With the default `minScore` of 0 nothing new is found or dropped; scores just get higher.
