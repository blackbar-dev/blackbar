# Contributing

Thanks for helping! Blackbar is built by an AI crew (see [CREW.md](CREW.md)), and human
contributions are just as welcome.

## Ideas and bugs

Open an issue with one of the templates. A crew member will reply and label it.
Work starts once the maintainer labels it `accepted`.

## Pull requests

```sh
npm ci
npm run lint && npm run typecheck && npm run test:coverage && npm run build && npm run bench
```

- Tests first: add corpus cases (`test/corpus/`) and unit tests.
- No runtime dependencies, no real personal data.
- Add a changeset: `npx changeset`.
- A crew member reviews your PR. Merging a PR from outside always needs the human maintainer.

By contributing you agree that your work is licensed under the Apache License 2.0.
