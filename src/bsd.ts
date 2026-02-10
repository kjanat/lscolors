/**
 * BSD LSCOLORS parsing, validation, and char↔ANSI code mappings.
 *
 * BSD uses single-letter color designators: a-h (normal), A-H (bright), x (default).
 * The 22-character LSCOLORS string encodes 11 fg/bg pairs, one per {@link BsdSlot}.
 */

import { BSD_SLOTS, type BsdSlot, type BsdSlotColors } from './types.ts';

// -------------------------
// Char ↔ ANSI mappings
// -------------------------

export const BSD_FG_CHARS = 'abcdefgh' as const;
export const BSD_FG_BRIGHT_CHARS = 'ABCDEFGH' as const;

const VALID_BSD_CHARS = new Set('abcdefghABCDEFGHx');

export function isValidBsdChar(ch: string): boolean {
	return VALID_BSD_CHARS.has(ch);
}

export function bsdCharToAnsiFg(ch: string): number | null {
	const idx = BSD_FG_CHARS.indexOf(ch);
	if (idx !== -1) return 30 + idx;
	const brightIdx = BSD_FG_BRIGHT_CHARS.indexOf(ch);
	if (brightIdx !== -1) return 90 + brightIdx;
	return null; // 'x' or unknown
}

export function bsdCharToAnsiBg(ch: string): number | null {
	const idx = BSD_FG_CHARS.indexOf(ch);
	if (idx !== -1) return 40 + idx;
	const brightIdx = BSD_FG_BRIGHT_CHARS.indexOf(ch);
	if (brightIdx !== -1) return 100 + brightIdx;
	return null;
}

export function ansiFgToBsdChar(code: number): string {
	if (code >= 30 && code <= 37) return BSD_FG_CHARS[code - 30] ?? 'x';
	if (code >= 90 && code <= 97) return BSD_FG_BRIGHT_CHARS[code - 90] ?? 'x';
	return 'x';
}

export function ansiBgToBsdChar(code: number): string {
	if (code >= 40 && code <= 47) return BSD_FG_CHARS[code - 40] ?? 'x';
	if (code >= 100 && code <= 107) return BSD_FG_BRIGHT_CHARS[code - 100] ?? 'x';
	return 'x';
}

// -------------------------
// LSCOLORS parsing / formatting
// -------------------------

export function parseLscolors(lscolors: string): Map<BsdSlot, BsdSlotColors> {
	if (lscolors.length !== 22) {
		throw new Error(
			`LSCOLORS must be exactly 22 chars (got ${String(lscolors.length)})`,
		);
	}
	const map = new Map<BsdSlot, BsdSlotColors>();
	for (let i = 0; i < BSD_SLOTS.length; i++) {
		const slot = BSD_SLOTS[i];
		const fg = lscolors[2 * i];
		const bg = lscolors[2 * i + 1];
		if (slot === undefined || fg === undefined || bg === undefined) {
			throw new Error(`Invalid LSCOLORS at position ${String(2 * i)}`);
		}
		if (!isValidBsdChar(fg) || !isValidBsdChar(bg)) {
			throw new Error(
				`Invalid BSD color char at position ${String(2 * i)}: '${fg}${bg}' (valid: a-h, A-H, x)`,
			);
		}
		map.set(slot, { fg, bg });
	}
	return map;
}

export function stringifyLscolors(map: Map<BsdSlot, BsdSlotColors>): string {
	let out = '';
	for (const slot of BSD_SLOTS) {
		const v = map.get(slot);
		out += (v?.fg ?? 'x') + (v?.bg ?? 'x');
	}
	if (out.length !== 22) {
		throw new Error(
			`Internal error: produced invalid LSCOLORS length (${String(out.length)})`,
		);
	}
	return out;
}
