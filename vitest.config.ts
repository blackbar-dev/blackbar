import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'json-summary'],
      // Coverage must not drop. Raise these when coverage goes up, never lower them.
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
});
