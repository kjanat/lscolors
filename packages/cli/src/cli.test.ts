import { runCommand } from 'dreamcli/testkit';
import { describe, expect, it } from 'vitest';
import { bsd2gnuCmd, gnu2bsdCmd } from './commands';

// ===================================================================
// bsd2gnu — BSD LSCOLORS → GNU LS_COLORS
// ===================================================================

describe('bsd2gnu', () => {
	it('converts default macOS LSCOLORS', async () => {
		const result = await runCommand(bsd2gnuCmd, ['exfxcxdxbxegedabagacad']);
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toContain('di=34');
		expect(result.stdout[0]).toContain('ln=35');
	});

	it('converts all-default LSCOLORS', async () => {
		const result = await runCommand(bsd2gnuCmd, ['xxxxxxxxxxxxxxxxxxxxxx']);
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toBeDefined();
	});

	it('respects --no-bg flag', async () => {
		const withBg = await runCommand(bsd2gnuCmd, ['exfxcxdxbxegedabagacad']);
		const withoutBg = await runCommand(bsd2gnuCmd, [
			'exfxcxdxbxegedabagacad',
			'--no-bg',
		]);
		expect(withoutBg.exitCode).toBe(0);
		expect(withBg.stdout[0]).toContain('bd=34;46');
		expect(withoutBg.stdout[0]).not.toContain(';46');
	});

	it('respects --no-defaults flag', async () => {
		const withDefaults = await runCommand(bsd2gnuCmd, [
			'exfxcxdxbxegedabagacad',
		]);
		const withoutDefaults = await runCommand(bsd2gnuCmd, [
			'exfxcxdxbxegedabagacad',
			'--no-defaults',
		]);
		expect(withoutDefaults.exitCode).toBe(0);
		expect(withDefaults.stdout[0]).toContain('or=31');
		expect(withoutDefaults.stdout[0]).not.toContain('or=31');
	});

	it('errors on invalid LSCOLORS', async () => {
		const result = await runCommand(bsd2gnuCmd, ['abc']);
		expect(result.exitCode).toBe(1);
		expect(result.error?.code).toBe('CONVERSION_ERROR');
	});

	it('reads $LSCOLORS when no arg provided', async () => {
		const result = await runCommand(bsd2gnuCmd, [], {
			env: { LSCOLORS: 'exfxcxdxbxegedabagacad' },
		});
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toContain('di=34');
	});

	it('positional arg takes precedence over $LSCOLORS', async () => {
		const result = await runCommand(bsd2gnuCmd, ['exfxcxdxbxegedabagacad'], {
			env: { LSCOLORS: 'xxxxxxxxxxxxxxxxxxxxxx' },
		});
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toContain('di=34');
	});

	it('outputs JSON with --json', async () => {
		const result = await runCommand(bsd2gnuCmd, ['exfxcxdxbxegedabagacad'], {
			jsonMode: true,
		});
		expect(result.exitCode).toBe(0);
		const json: unknown = JSON.parse(result.stdout[0] ?? '');
		expect(json).toEqual(
			expect.objectContaining({
				input: 'exfxcxdxbxegedabagacad',
				from: 'bsd',
				to: 'gnu',
			}),
		);
	});

	it('shows help on --help', async () => {
		const result = await runCommand(bsd2gnuCmd, ['--help']);
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toContain('bsd2gnu');
		expect(result.stdout[0]).toContain('LSCOLORS');
	});
});

// ===================================================================
// gnu2bsd — GNU LS_COLORS → BSD LSCOLORS
// ===================================================================

describe('gnu2bsd', () => {
	it('converts basic GNU LS_COLORS', async () => {
		const result = await runCommand(gnu2bsdCmd, ['di=01;34:ln=01;36']);
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toMatch(/^[a-hA-Hx]{22}\n$/);
	});

	it('maps bold to uppercase BSD char', async () => {
		const result = await runCommand(gnu2bsdCmd, ['di=01;34']);
		expect(result.exitCode).toBe(0);
		// bold blue (01;34) → E (uppercase e = bright blue)
		expect(result.stdout[0]?.startsWith('E')).toBe(true);
	});

	it('respects --fallback flag', async () => {
		const result = await runCommand(gnu2bsdCmd, [
			'di=34',
			'--fallback',
			'exfxcxdxbxegedabagacad',
		]);
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toMatch(/^[a-hA-Hx]{22}\n$/);
	});

	it('errors on invalid --fallback', async () => {
		const result = await runCommand(gnu2bsdCmd, ['di=34', '--fallback', 'abc']);
		expect(result.exitCode).toBe(1);
		expect(result.error?.code).toBe('INVALID_FLAG');
	});

	it('reads $LS_COLORS when no arg provided', async () => {
		const result = await runCommand(gnu2bsdCmd, [], {
			env: { LS_COLORS: 'di=01;34:ln=01;36' },
		});
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toMatch(/^[a-hA-Hx]{22}\n$/);
	});

	it('positional arg takes precedence over $LS_COLORS', async () => {
		const result = await runCommand(gnu2bsdCmd, ['di=01;34:ln=01;36'], {
			env: { LS_COLORS: 'di=31' },
		});
		expect(result.exitCode).toBe(0);
		// bold blue (01;34) → E, not red from env
		expect(result.stdout[0]?.startsWith('E')).toBe(true);
	});

	it('resolves --fallback from $LSCOLORS via .env()', async () => {
		const result = await runCommand(gnu2bsdCmd, ['di=34'], {
			env: { LSCOLORS: 'exfxcxdxbxegedabagacad' },
		});
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toMatch(/^[a-hA-Hx]{22}\n$/);
	});

	it('outputs JSON with --json', async () => {
		const result = await runCommand(gnu2bsdCmd, ['di=01;34:ln=01;36'], {
			jsonMode: true,
		});
		expect(result.exitCode).toBe(0);
		const json: unknown = JSON.parse(result.stdout[0] ?? '');
		expect(json).toEqual(
			expect.objectContaining({
				from: 'gnu',
				to: 'bsd',
			}),
		);
	});

	it('shows help on --help', async () => {
		const result = await runCommand(gnu2bsdCmd, ['--help']);
		expect(result.exitCode).toBe(0);
		expect(result.stdout[0]).toContain('gnu2bsd');
		expect(result.stdout[0]).toContain('LS_COLORS');
	});
});

// ===================================================================
// Round-trip identity
// ===================================================================

describe('round-trip', () => {
	it('BSD → GNU → BSD preserves original', async () => {
		const original = 'exfxcxdxbxegedabagacad';
		const toGnu = await runCommand(bsd2gnuCmd, [original]);
		expect(toGnu.exitCode).toBe(0);
		const gnuValue = toGnu.stdout[0]?.trim() ?? '';
		const toBsd = await runCommand(gnu2bsdCmd, [gnuValue]);
		expect(toBsd.exitCode).toBe(0);
		expect(toBsd.stdout[0]?.trim()).toBe(original);
	});
});
