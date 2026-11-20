// Fails when recall or precision of any type got worse than on main.
// Usage: node bench/compare.mjs <base.json> <head.json> [--summary file.md]
import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const [basePath, headPath] = process.argv.slice(2);
const summaryIdx = process.argv.indexOf('--summary');
const summary = summaryIdx >= 0 ? process.argv[summaryIdx + 1] : undefined;
const head = JSON.parse(readFileSync(headPath, 'utf8'));
const base = basePath && existsSync(basePath) ? JSON.parse(readFileSync(basePath, 'utf8')) : {};
const EPS = 1e-9;

const lines = ['| Type | Recall (main → PR) | Precision (main → PR) |', '|---|---|---|'];
const failures = [];
const fmt = (x) => (x === undefined ? '–' : x.toFixed(3));

for (const type of [...new Set([...Object.keys(base), ...Object.keys(head)])].sort()) {
  const b = base[type];
  const h = head[type];
  if (!h) {
    failures.push(`${type}: no longer measured`);
    continue;
  }
  for (const metric of ['recall', 'precision']) {
    if (b && h[metric] + EPS < b[metric]) {
      failures.push(`${type} ${metric}: ${fmt(b[metric])} → ${fmt(h[metric])}`);
    }
  }
  lines.push(
    `| ${type} | ${fmt(b?.recall)} → ${fmt(h.recall)} | ${fmt(b?.precision)} → ${fmt(h.precision)} |`,
  );
}

const report = `### Benchmark\n\n${lines.join('\n')}\n\n${
  failures.length
    ? `**Worse than main:**\n${failures.map((f) => `- ${f}`).join('\n')}`
    : 'No regressions.'
}\n`;
console.log(report);
if (summary) appendFileSync(summary, report);
if (!existsSync(basePath ?? '')) console.log('(No baseline from main yet, nothing to compare.)');
process.exit(failures.length ? 1 : 0);
