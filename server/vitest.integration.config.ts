import { defineConfig } from 'vitest/config'

// Real-SQL tests: an embedded Postgres with schema.sql applied (twice).
export default defineConfig({
  test: {
    include: ['__integration__/**/*.test.ts'],
    globalSetup: ['__integration__/globalSetup.ts'],
    setupFiles: ['__integration__/setup.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      RATE_LIMIT_PER_MINUTE: '100000',
      SUPABASE_URL: 'http://127.0.0.1:1',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
      DATABASE_SSL: 'false',
      // Fixed local URL so these tests can never touch the real Supabase DB.
      DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:54329/klaket',
    },
  },
})
