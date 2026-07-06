import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'bin/rails server -e test -p 3001',
    url: 'http://127.0.0.1:3001/up',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      // Test-only /ops fixtures for the e2e auth suite — not real
      // credentials (the real pair lives only in the hosting dashboard).
      // Local runs boot the server manually with the same pair.
      OPS_USERNAME: 'ops-e2e',
      OPS_PASSWORD: 'ops-e2e-not-a-secret',
    },
  },
})
