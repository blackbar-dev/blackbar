// Measures recall and precision of the built package over test/corpus/*.json.
// Usage: node bench/run.mjs [--out bench/results/latest.json] [--dist dist] [--corpus test/corpus]
// CI runs main's build (--dist) against the PR's corpus, so both sides face the same cases.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : fallback;
};
const out = resolve(opt('--out', 'bench/results/latest.json'));
const corpusDir = resolve(opt('--corpus', 'test/corpus'));
const dist = resolve(opt('--dist', 'dist'));
const { detect } = await import(pathToFileURL(join(dist, 'index.js')).href);

const stats = {};
const row = (type) => {
  stats[type] ??= { tp: 0, fp: 0, fn: 0 };
  return stats[type];
};
const misses = [];

for (const file of readdirSync(corpusDir)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  for (const c of JSON.parse(readFileSync(join(corpusDir, file), 'utf8'))) {
    const found = detect(c.text).map((m) => `${m.type}\u0000${m.value}`);
    const expected = c.expected.map((e) => `${e.type}\u0000${e.value}`);
    const left = [...expected];
    for (const f of found) {
      const i = left.indexOf(f);
      const [type, value] = f.split('\u0000');
      if (i >= 0) {
        row(type).tp++;
        left.splice(i, 1);
      } else {
        row(type).fp++;
        misses.push(`${c.id}  false alarm  ${type} "${value}"`);
      }
    }
    for (const l of left) {
      const [type, value] = l.split('\u0000');
      row(type).fn++;
      misses.push(`${c.id}  missed       ${type} "${value}"`);
    }
  }
}

const round = (x) => Math.round(x * 10000) / 10000;
const result = {};
for (const [type, s] of Object.entries(stats).sort()) {
  result[type] = {
    ...s,
    recall: round(s.tp + s.fn === 0 ? 1 : s.tp / (s.tp + s.fn)),
    precision: round(s.tp + s.fp === 0 ? 1 : s.tp / (s.tp + s.fp)),
  };
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);

console.log('type   recall  precision   tp  fp  fn');
for (const [type, r] of Object.entries(result)) {
  console.log(
    `${type.padEnd(6)} ${r.recall.toFixed(3).padStart(6)} ${r.precision.toFixed(3).padStart(10)} ${String(r.tp).padStart(4)} ${String(r.fp).padStart(3)} ${String(r.fn).padStart(3)}`,
  );
}
if (misses.length) console.log(`\n${misses.join('\n')}`);
