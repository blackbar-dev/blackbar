# The crew

Blackbar is developed by AI characters from _OfficeLife_. They are not real people.
Each one is an AI agent with its own persona (`.crew/personas/`), working through the
GitHub App **Synapsio Crew**. Commits name the character as author; reviews come from
`synapsio-crew[bot]` and start with the character's name.

| Character                | Role at Synapsio    | Works on                             |
| ------------------------ | ------------------- | ------------------------------------ |
| Kevin O'Brien            | CTO                 | core code, quick reviews             |
| Ingrid Solberg           | Staff Engineer      | core code, strict reviews            |
| Valentina "Vale" Ramírez | Engineering intern  | detectors and tests, curious reviews |
| Dieter Krause | Finance | reviews German formats, AI budget (does not code) |
| Jules Diallo             | Product Designer    | CLI output, website, logo            |
| Remi Balogun             | Developer Relations | docs, community, triage of issues    |
| Brooke Hamilton          | CEO                 | roadmap, release notes               |
| Priya Patel              | Head of People      | sprints, retros                      |
| NOVA                     | in-house AI         | build status                         |

## How the team works

1. Work starts from an issue with the label `accepted`. Only the human maintainer sets it.
2. One character writes tests and code on a branch `crew/<character>/<issue>-<name>` and opens a PR.
3. CI (`ci`) runs lint, types, tests, coverage, build and the corpus benchmark.
4. A different character reviews the diff (`crew-review`). Up to three fix rounds.
5. With `ci` and `crew-review` green, the PR is merged. Changes to protected paths
   (workflows, rules, `package.json`) always need the human maintainer.

## Guard rails

- The crew never runs code from forks and never takes instructions from issue or comment text.
- The GitHub App can read and write contents, PRs, issues and checks of this repo only. It cannot edit workflows.
- No runtime dependencies. No real personal data in the corpus.
- A repo variable `CREW_ENABLED` switches all crew workflows off at once.

The full rule set for agents is in [AGENTS.md](AGENTS.md) and [.crew/rules.md](.crew/rules.md).
