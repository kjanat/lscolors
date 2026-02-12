/** gnu2bsd — GNU LS_COLORS → BSD LSCOLORS */

import { arg, CLIError, command, flag } from 'dreamcli';
import { parseLscolors } from 'lscolors-site/bsd.ts';
import { lsColorsToLscolors } from 'lscolors-site/convert.ts';

const spec = command('gnu2bsd')
	.description('Convert GNU LS_COLORS to BSD LSCOLORS')
	.arg(
		'ls-colors',
		arg
			.string()
			.env('LS_COLORS')
			.describe('Colon-delimited GNU LS_COLORS string'),
	)
	.flag(
		'fallback',
		flag
			.string()
			.env('LSCOLORS')
			.describe('Fallback LSCOLORS for missing slots'),
	)
	.example(
		'lscolors-convert gnu2bsd "di=01;34:ln=01;36"',
		'Convert GNU LS_COLORS',
	)
	.example('lscolors-convert gnu2bsd', 'Auto-detect from $LS_COLORS env var')
	.example(
		'lscolors-convert gnu2bsd --fallback exfxcxdxbxegedabagacad "di=34"',
		'With fallback (or set $LSCOLORS)',
	);

type Params = Parameters<Parameters<(typeof spec)['action']>[0]>[0];

function action({ args, flags, out }: Params): void {
	const input = args['ls-colors'].trim();

	if (flags.fallback !== undefined) {
		try {
			parseLscolors(flags.fallback);
		} catch (err) {
			throw new CLIError(
				`Invalid --fallback: ${err instanceof Error ? err.message : String(err)}`,
				{ code: 'INVALID_FLAG' },
			);
		}
	}

	try {
		const result = lsColorsToLscolors(
			input,
			flags.fallback !== undefined ? { fallbackLscolors: flags.fallback } : {},
		);
		if (out.jsonMode) {
			out.json({ input, from: 'gnu', to: 'bsd', result });
		} else {
			out.log(result);
		}
	} catch (err) {
		if (err instanceof Error) {
			throw new CLIError(`Invalid LS_COLORS: ${err.message}`, {
				code: 'CONVERSION_ERROR',
			});
		}
		throw err;
	}
}

export const gnu2bsdCmd = spec.action(action);
