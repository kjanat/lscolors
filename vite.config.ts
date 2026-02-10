import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import devtoolsJson from 'vite-plugin-devtools-json';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	base:
		process.env.GITHUB_ACTIONS === 'true'
			? /* biome-ignore lint/style/noNonNullAssertion: We know that
				 * GITHUB_REPOSITORY will be set in GitHub Actions, and we want
				 * to ensure that the base path is correct for GitHub Pages. */
				`/${process.env.GITHUB_REPOSITORY!.split('/')[1]}/`
			: '/',
	build: { outDir: 'dist' },
	server: { allowedHosts: ['propc-manjaro'] },
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }],
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
				},
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
		],
	},
	plugins: [svelte(), devtoolsJson()],
});
