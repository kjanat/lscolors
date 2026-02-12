#!/usr/bin/env node

/**
 * CLI entry point for lscolors-convert.
 *
 * Two subcommands:
 *   bsd2gnu — convert BSD LSCOLORS to GNU LS_COLORS
 *   gnu2bsd — convert GNU LS_COLORS to BSD LSCOLORS
 */

import { name, version, description } from '../package.json' with {
	type: 'json',
};
import { cli } from 'dreamcli';
import { bsd2gnuCmd, gnu2bsdCmd } from './commands';

const ls = cli(name).packageJson({ inferName: true })
	.version(version)
	.description(description)
	.command(bsd2gnuCmd)
	.command(gnu2bsdCmd)
	.run();

ls.catch((err) => {
	if (err instanceof Error) {
		console.error(`Error: ${err.message}`);
	} else {
		console.error(`Error: ${String(err)}`);
	}
	process.exit(1);
});
