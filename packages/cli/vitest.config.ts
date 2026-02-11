import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'lscolors-site': resolve(import.meta.dirname, '../../src'),
		},
	},
	test: {
		expect: { requireAssertions: true },
	},
});
