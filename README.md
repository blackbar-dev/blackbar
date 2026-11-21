# Blackbar

[![ci](https://github.com/blackbar-dev/blackbar/actions/workflows/ci.yml/badge.svg)](https://github.com/blackbar-dev/blackbar/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

**Find personal data in text, black it out, and put it back later.**
Zero runtime dependencies. Apache 2.0 licensed.

![Blackbar finds an e-mail address and an IBAN in a support ticket, swaps them for [EMAIL_1] and [IBAN_1], and puts the real values back into the LLM's reply](docs/media/demo.gif)

```ts
import { redact, restore } from 'blackbar';

const { text, mapping } = redact('Mail anna@example.com, pay to DE89 3704 0044 0532 0130 00.');
// text:    'Mail [EMAIL_1], pay to [IBAN_1].'
// mapping: { '[EMAIL_1]': 'anna@example.com', '[IBAN_1]': 'DE89 3704 0044 0532 0130 00' }

// …send `text` to an LLM or a log, then:
restore(text, mapping); // the original text again
```

Typical use: strip personal data before a text goes to an LLM, a ticket system or a log,
and restore it in the answer.

```sh
npx blackbar redact --map mapping.json < mail.txt > safe.txt
npx blackbar restore --map mapping.json < answer.txt
```

## What it finds

| Type                                | Status              |
| ----------------------------------- | ------------------- |
| E-mail addresses                    | ✅                  |
| IBAN (with checksum, 80+ countries) | ✅                  |
| Phone numbers                       | planned for v0.1    |
| Credit card numbers (Luhn)          | ✅                  |
| IP addresses (v4, v6)               | planned for v0.1    |
| URLs (http, https, ftp, www.)       | ✅                  |
| MAC addresses                       | ✅                  |
| Names, postal addresses             | later (much harder) |

Every match carries a `score` from 0 to 1. Checksum-validated formats score high (IBAN 0.95,
card 0.9), pattern-only formats lower (e-mail 0.8, URL 0.8, IP 0.7, MAC 0.7). Pass `minScore` to `detect` or
`redact` to be stricter; by default every match is reported. The range is not checked: a
`minScore` above 1 drops every match. When matches overlap, the longer span wins, then the
higher score, then the earlier one, so a short match never leaves part of a longer one in the
text. A match that only partly overlaps the winner is merged into it: the winner grows to cover
both spans, so no part of either finding stays in the text. A custom detector that leaves out `score` gets 1, so its matches are never dropped
silently by any `minScore` up to 1.

Hint words raise the score: `IP 1.2.3.4` is more likely an address than `Abschnitt 1.2.3.4`.
Each built-in detector has a few German and English hints. If one appears in the 32 characters
before a match, the score goes up by `HINT_STEP` (0.2), once, capped at 1. Case, umlaut spelling
(`ü`/`ue`, `ß`/`ss`) and spaces vs. hyphens (`Steuer-ID`, `steuer id`) do not matter; hints match
whole words only. Add your own per type and widen the window if you like:

```ts
detect(text, {
  minScore: 0.8,
  hints: { IP: ['Router', 'Gateway'] },
  hintWindow: { before: 40, after: 20 },
});
```

Every change is measured against a synthetic corpus (`test/corpus/`). CI blocks any change
that lowers recall or precision. Current numbers are in each CI run's summary.

## Who builds this

Blackbar is maintained by an **AI team**: the characters of _OfficeLife_, a show about a small
Brooklyn startup called Synapsio. They write the code, review each other and argue about it
in the office. A human (@bash-bash) supervises: rules, workflows, dependencies and releases
need their approval. See [CREW.md](CREW.md).

Contributions from humans are very welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache License 2.0](LICENSE)
