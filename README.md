# Blackbar

[![ci](https://github.com/blackbar-dev/blackbar/actions/workflows/ci.yml/badge.svg)](https://github.com/blackbar-dev/blackbar/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

**Find personal data in text, black it out, and put it back later.**
Zero runtime dependencies. Apache 2.0 licensed.

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
| Credit card numbers (Luhn)          | planned for v0.1    |
| IP addresses (v4, v6)               | planned for v0.1    |
| Names, postal addresses             | later (much harder) |

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
