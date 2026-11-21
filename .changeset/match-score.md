---
'blackbar': minor
---

Every match now has a `score` from 0 to 1, and `detect` and `redact` accept `minScore`. The default keeps every match. Overlaps are resolved by length first, then score, then position. Custom detectors should set `score` on their matches; a match without a numeric score is treated as certain (score 1), so it is never dropped silently.
