/**
 * Subcommand definitions for lscolors-convert.
 *
 * bsd2gnu: BSD LSCOLORS → GNU LS_COLORS
 * gnu2bsd: GNU LS_COLORS → BSD LSCOLORS
 */

import { arg, CLIError, command, flag } from 'dreamcli';
import type { LscolorsToLsColorsOptions } from 'lscolors-site/convert.ts';
import {
	lsColorsToLscolors,
	lscolorsToLsColors,
} from 'lscolors-site/convert.ts';

// ---------------------------------------------------------------------------
// Stdin reader
// ---------------------------------------------------------------------------

/** Read all of stdin. Returns null if stdin is a TTY or has no piped data. */
async function readStdin(): Promise<string | null> {
	if (process.stdin.isTTY) return null;
	if (process.stdin.readableEnded) return null;

	const chunks: Uint8Array[] = [];
	const timeout = new Promise<null>((resolve) =>
		setTimeout(() => resolve(null), 50),
	);
	const read = (async () => {
		for await (const chunk of process.stdin) {
			if (chunk instanceof Uint8Array) chunks.push(chunk);
		}
		return chunks.length > 0
			? Buffer.concat(chunks).toString('utf-8').trim()
			: null;
	})();

	return Promise.race([read, timeout]);
}

/** Resolve input from positional arg or stdin. */
async function resolveInput(
	positional: string | undefined,
	label: string,
): Promise<string> {
	if (positional !== undefined) return positional;

	const stdin = await readStdin();
	if (stdin !== null && stdin.length > 0) return stdin;

	throw new CLIError(`No ${label} value provided.`, {
		code: 'NO_INPUT',
		suggest: `Pass a value as argument or pipe via stdin`,
	});
}

// ---------------------------------------------------------------------------
// bsd2gnu — BSD LSCOLORS → GNU LS_COLORS
// ---------------------------------------------------------------------------

export const bsd2gnuCmd = command('bsd2gnu')
	.description('Convert BSD LSCOLORS  to GNU LS_COLORS')
	.arg(
		'lscolors',
		arg.string().optional().describe('22-char BSD LSCOLORS string'),
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
	.example('echo "$LSCOLORS" | lscolors-convert bsd2gnu', 'Pipe from stdin')
	.example(
		'lscolors-convert bsd2gnu --no-bg exfxcxdxbxegedabagacad',
		'Without background colors',
	)
	.action(async ({ args, flags, out }) => {
		const input = await resolveInput(args.lscolors, 'LSCOLORS');

		const opts: LscolorsToLsColorsOptions = {};
		if (flags['no-bg']) opts.includeBackground = false;
		if (flags['no-defaults']) opts.includeExtraDefaults = false;

		try {
			const result = lscolorsToLsColors(input.trim(), opts);
			if (out.jsonMode) {
				out.json({ input: input.trim(), from: 'bsd', to: 'gnu', result });
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
	});

// ---------------------------------------------------------------------------
// gnu2bsd — GNU LS_COLORS → BSD LSCOLORS
// ---------------------------------------------------------------------------

export const gnu2bsdCmd = command('gnu2bsd')
	.description('Convert GNU LS_COLORS to BSD LSCOLORS')
	.arg(
		'ls-colors',
		arg.string().optional().describe('Colon-delimited GNU LS_COLORS string'),
	)
	.flag(
		'fallback',
		flag
			.string()
			.describe('Fallback LSCOLORS for missing slots (default: all x)'),
	)
	.example(
		'lscolors-convert gnu2bsd "di=01;34:ln=01;36"',
		'Convert GNU LS_COLORS',
	)
	.example('echo "$LS_COLORS" | lscolors-convert gnu2bsd', 'Pipe from stdin')
	.example(
		'lscolors-convert gnu2bsd --fallback exfxcxdxbxegedabagacad "di=34"',
		'With fallback',
	)
	.action(async ({ args, flags, out }) => {
		const input = await resolveInput(args['ls-colors'], 'LS_COLORS');

		try {
			const result = lsColorsToLscolors(
				input.trim(),
				flags.fallback !== undefined
					? { fallbackLscolors: flags.fallback }
					: {},
			);
			if (out.jsonMode) {
				out.json({ input: input.trim(), from: 'gnu', to: 'bsd', result });
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
	});
