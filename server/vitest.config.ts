import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
    // One in-memory MongoDB per worker; integration files share it serially.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      JWT_ACCESS_SECRET: 'test-secret-that-is-definitely-long-enough-123',
      BCRYPT_ROUNDS: '4',
    },
  },
});
