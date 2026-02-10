import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'bun run build && bun run preview',
		port: 4173,
		timeout: 60_000,
		reuseExistingServer: !process.env.CI,
	},
	testDir: 'e2e',
});
