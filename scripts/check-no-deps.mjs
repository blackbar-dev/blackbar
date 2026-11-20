// Blackbar has zero runtime dependencies. Any entry here fails CI.
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const bad = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
  'bundleDependencies',
].flatMap((field) => Object.keys(pkg[field] ?? {}).map((name) => `${field}: ${name}`));

if (bad.length) {
  console.error(`Runtime dependencies are not allowed:\n${bad.join('\n')}`);
  process.exit(1);
}
console.log('No runtime dependencies.');
