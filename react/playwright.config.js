import { defineConfig } from '@playwright/test';

export default defineConfig({
   testDir: './e2e',
   fullyParallel: true,
   workers: 2,
   timeout: 30000,
   use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure', serviceWorkers: 'block' },
   webServer: {
      command: 'node node_modules/vite/bin/vite.js --config vite.e2e.config.js',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120000,
      env: { VITE_API_BASE_URL: 'http://127.0.0.1:4173' },
   },
});
