import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(relativePath: string) {
  const filePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// Ensure Playwright runner can access Next/Supabase env without requiring manual exports.
loadEnvFile('.env');
loadEnvFile('.env.local');

const port = Number(process.env.PLAYWRIGHT_PORT || 3100);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && node scripts/copy-next-standalone-assets.js && node .next/standalone/server.js',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { ...process.env, PORT: String(port) } as Record<string, string>,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
