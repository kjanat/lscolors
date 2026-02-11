#!/usr/bin/env node

/**
 * CLI entry point for lscolors-convert.
 *
 * Two subcommands:
 *   bsd2gnu — convert BSD LSCOLORS to GNU LS_COLORS
 *   gnu2bsd — convert GNU LS_COLORS to BSD LSCOLORS
 */

import { cli } from 'dreamcli';
import { bsd2gnuCmd, gnu2bsdCmd } from './commands.ts';

cli('lscolors-convert')
	.version('0.1.0')
	.description(
		'Convert between macOS/BSD LSCOLORS and GNU LS_COLORS terminal color formats',
	)
	.command(bsd2gnuCmd)
	.command(gnu2bsdCmd)
	.run();
