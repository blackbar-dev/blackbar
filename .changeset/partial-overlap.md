---
'blackbar': patch
---

`detect` no longer leaves personal data in the text when two matches overlap only partly. The winning match grows to cover both spans and keeps its type and score; `redact` stores the full original text of the grown span, so `restore` still round-trips. A match fully inside another one is dropped as before.
