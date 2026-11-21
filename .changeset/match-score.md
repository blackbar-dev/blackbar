---
'blackbar': minor
---

Every match now has a `score` from 0 to 1, and `detect` and `redact` accept `minScore`. The default keeps every match. Overlaps are resolved by score first, then length, then position. Custom detectors must now set `score` on their matches.
