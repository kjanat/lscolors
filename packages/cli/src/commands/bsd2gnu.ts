/** bsd2gnu — BSD LSCOLORS → GNU LS_COLORS */

import { arg, CLIError, command, flag } from 'dreamcli';
import type { LscolorsToLsColorsOptions } from 'lscolors-site/convert.ts';
import { lscolorsToLsColors } from 'lscolors-site/convert.ts';

const spec = command('bsd2gnu')
	.description('Convert BSD LSCOLORS  to GNU LS_COLORS')
	.arg(
		'lscolors',
		arg.string().env('LSCOLORS').describe('22-char BSD LSCOLORS string'),
	)
	.flag('no-bg', flag.boolean().describe('Omit background colors'))
	.flag(
		'no-defaults',
		flag.boolean().describe('Omit extra defaults like or/mi'),
	)
	.example(
		'lscolors-convert bsd2gnu exfxcxdxbxegedabagacad',
		'Convert default macOS LSCOLORS',
	)
	.example('lscolors-convert bsd2gnu', 'Auto-detect from $LSCOLORS env var')
	.example(
		'lscolors-convert bsd2gnu --no-bg exfxcxdxbxegedabagacad',
		'Without background colors',
	);

type Params = Parameters<Parameters<(typeof spec)['action']>[0]>[0];

function action({ args, flags, out }: Params): void {
	const input = args.lscolors.trim();

	const opts: LscolorsToLsColorsOptions = {};
	if (flags['no-bg']) opts.includeBackground = false;
	if (flags['no-defaults']) opts.includeExtraDefaults = false;

	try {
		const result = lscolorsToLsColors(input, opts);
		if (out.jsonMode) {
			out.json({ input, from: 'bsd', to: 'gnu', result });
		} else {
			out.log(result);
		}
	} catch (err) {
		if (err instanceof Error) {
			throw new CLIError(`Invalid LSCOLORS: ${err.message}`, {
				code: 'CONVERSION_ERROR',
			});
		}
		throw err;
	}
}

export const bsd2gnuCmd = spec.action(action);
