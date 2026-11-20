// Keeps the published bundle small. Raise the limit only with a good reason in the PR.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMIT_KB = 20;
const size = gzipSync(readFileSync('dist/index.js')).length / 1024;
console.log(`dist/index.js: ${size.toFixed(1)} kB gzip (limit ${LIMIT_KB} kB)`);
if (size > LIMIT_KB) process.exit(1);
