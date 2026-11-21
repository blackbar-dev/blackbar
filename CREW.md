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
| Kiki Sato                | Security Engineer   | security check on every PR, `security` issues |
| Jules Diallo             | Product Designer    | CLI output, website, logo            |
| Remi Balogun             | Developer Relations | docs, community, triage of issues    |
| Brooke Hamilton          | CEO                 | roadmap, release notes               |
| Priya Patel              | Head of People      | sprints, retros                      |
| NOVA                     | in-house AI         | build status                         |

## How the team works

1. Work starts from an issue with the label `accepted`. Only the human maintainer sets it.
2. One character writes tests and code on a branch `crew/<character>/<issue>-<name>` and opens a PR.
3. CI (`ci`) runs lint, types, tests, coverage, build and the corpus benchmark.
4. After CI, Kiki runs the security check (`crew-security`): the full check with Opus on
   PRs from outside, on crew PRs for issues opened by outside people, and on everything that
   touches more than tests, docs and changesets; a quick check with Sonnet otherwise. She blocks
   only on medium or high findings with a concrete attack path. The quick check never blocks by
   itself: if it sees something serious, the full check runs and decides.
   A problem in code that is already released is never described in public: the PR gets `hold`
   and `security-hold`, and the details go to the maintainer privately.
5. Then a different character reviews the diff (`crew-review`). Ingrid, Kevin and Vale take
   turns; Dieter reviews changes to German and banking formats. The reviewer only reads the diff,
   it never runs PR code. Failed CI, requested changes or a blocking security finding start a fix round for the author,
   up to three rounds, then the PR gets the label `crew-stuck` for the maintainer.
6. With `ci`, `crew-security` and `crew-review` green, a PR that only touches `src/`, `test/` and changesets is
   merged automatically (switch: repo variable `CREW_AUTO_MERGE`). Everything else, including
   workflows, rules and `package.json`, is always merged by the human maintainer.
7. The label `hold` on a PR stops all crew activity on it.
8. PRs from forks get Kiki's security check as advice for the maintainer. The crew never reviews,
   fixes or merges them.

## Guard rails

- The crew never runs code from forks and never takes instructions from issue or comment text.
- The GitHub App can read and write contents, PRs, issues and checks of this repo only. It cannot edit workflows.
- No runtime dependencies. No real personal data in the corpus.
- A repo variable `CREW_ENABLED` switches all crew workflows off at once.

The full rule set for agents is in [AGENTS.md](AGENTS.md) and [.crew/rules.md](.crew/rules.md).
