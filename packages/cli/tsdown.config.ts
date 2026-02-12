import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/cli.ts'],
	platform: 'node',
	clean: true,
	dts: false,
	minify: true,
	noExternal: ['dreamcli'],
	treeshake: true,
	nodeProtocol: 'strip',
});
