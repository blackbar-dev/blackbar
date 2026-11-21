# Korpus / Corpus

Synthetic sample texts with the findings we expect. **No real personal data, ever.**
Use `example.com`, `example.org`, `example.net` for e-mail domains and the published
test IBANs (e.g. `DE89370400440532013000`).

German tax IDs (`tax-id.json`) are made up. There is no reserved test range that passes the check
digit (the ELSTER test IDs start with 0), so a valid made-up IdNr could belong to someone. Reuse
the few numbers already in the file (`47152039646`, `29381075632`, …) instead of inventing new ones.

Each file is a JSON array of cases:

```json
{ "id": "email-001", "text": "…", "expected": [{ "type": "EMAIL", "value": "anna@example.com" }] }
```

`expected: []` is a negative case: nothing should be found. Negative cases matter as much
as positive ones, because they catch false alarms.

A case may carry `options` for `detect` (see `hints.json`, where the hint decides whether a
match passes `minScore`). The unit tests honour them; `npm run bench` uses the defaults, so the
expected findings must hold both ways.

`npm run bench` measures recall and precision over all files here.
