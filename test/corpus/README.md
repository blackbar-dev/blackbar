# Korpus / Corpus

Synthetic sample texts with the findings we expect. **No real personal data, ever.**
Use `example.com`, `example.org`, `example.net` for e-mail domains and the published
test IBANs (e.g. `DE89370400440532013000`).

Each file is a JSON array of cases:

```json
{ "id": "email-001", "text": "…", "expected": [{ "type": "EMAIL", "value": "anna@example.com" }] }
```

`expected: []` is a negative case: nothing should be found. Negative cases matter as much
as positive ones, because they catch false alarms.

`npm run bench` measures recall and precision over all files here.
