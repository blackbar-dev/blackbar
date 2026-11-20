import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', cli: 'cli/index.ts' },
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  splitting: false,
  // Type declarations come from `tsc -p tsconfig.build.json` (see the build script).
  dts: false,
  sourcemap: false,
  minify: false,
});
