import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		exclude: ['src/**/*.svelte.test.ts', 'src/**/*.svelte.spec.ts'],
	},
});
