#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { redact, restore } from '../src/index.js';

const HELP = `Usage:
  blackbar redact  [--map mapping.json] < input.txt > redacted.txt
  blackbar restore  --map mapping.json  < redacted.txt > restored.txt

The mapping file holds the original values. Keep it private.`;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const command = process.argv[2];
const input = command === 'redact' || command === 'restore' ? readFileSync(0, 'utf8') : '';
const mapPath = arg('--map');

if (command === 'redact') {
  const result = redact(input);
  process.stdout.write(result.text);
  if (mapPath)
    writeFileSync(mapPath, `${JSON.stringify(result.mapping, null, 2)}\n`, { mode: 0o600 });
} else if (command === 'restore' && mapPath) {
  process.stdout.write(restore(input, JSON.parse(readFileSync(mapPath, 'utf8'))));
} else {
  console.error(HELP);
  process.exit(command === '--help' || command === '-h' ? 0 : 1);
}
