import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { API_TIMEOUT_MS, DIFY_BASE_URL } from './config/env';

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.ts',
  outputDir: '.features-gen',
});

export default defineConfig({
  testDir,
  timeout: API_TIMEOUT_MS,
  expect: {
    timeout: 5_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'always' }],
    ['./utils/MetricsReporter.ts'],
  ],
  use: {
    baseURL: DIFY_BASE_URL,
    actionTimeout: API_TIMEOUT_MS,
  },
  workers: process.env.CI ? 1 : undefined,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
});