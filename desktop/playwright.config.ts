import { defineConfig } from '@playwright/test'

// Runs the editor in a browser against `report-cli serve` (the same engine the desktop app embeds).
const cli = process.env.RB_CLI ?? '../target/release/report-cli'
const chromium = process.env.PLAYWRIGHT_CHROMIUM ?? (process.env.PLAYWRIGHT_BROWSERS_PATH === '/opt/pw-browsers' ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined)

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:1420',
    viewport: { width: 1440, height: 900 },
    launchOptions: chromium ? { executablePath: chromium } : {},
    acceptDownloads: true,
  },
  webServer: [
    { command: `${cli} serve --port 7878`, url: 'http://127.0.0.1:7878/api/health', reuseExistingServer: true, timeout: 120_000 },
    { command: 'npx vite --port 1420 --strictPort', url: 'http://localhost:1420', reuseExistingServer: true, timeout: 120_000 },
  ],
})
