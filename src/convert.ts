/**
 * Bidirectional conversion between BSD LSCOLORS and GNU LS_COLORS.
 *
 * Also provides 256-color → 16-color approximation and BSD char → CSS color mapping.
 */

import {
	ansiBgToBsdChar,
	ansiFgToBsdChar,
	BSD_FG_BRIGHT_CHARS,
	BSD_FG_CHARS,
	bsdCharToAnsiBg,
	bsdCharToAnsiFg,
	parseLscolors,
	stringifyLscolors,
} from './bsd.ts';
import { parseLsColors, stringifyLsColors } from './gnu.ts';
import { parseSgr } from './sgr.ts';
import { BSD_SLOTS, type BsdSlot, type BsdSlotColors, type CssColor, type SlotCssColors, type Style } from './types.ts';

// -------------------------
// LSCOLORS → LS_COLORS
// -------------------------

export interface LscolorsToLsColorsOptions {
	/** Include background colors in output (default: true) */
	includeBackground?: boolean;
	/** Include extra default keys like or/mi (default: true) */
	includeExtraDefaults?: boolean;
	/** Override default extra keys */
	extraDefaults?: Readonly<Record<string, string>>;
}

export function lscolorsToLsColors(
	lscolors: string,
	opts: LscolorsToLsColorsOptions = {},
): string {
	const includeBackground = opts.includeBackground ?? true;
	const includeExtraDefaults = opts.includeExtraDefaults ?? true;

	const slots = parseLscolors(lscolors);
	const out = new Map<string, Style>();

	for (const slot of BSD_SLOTS) {
		const colors = slots.get(slot);
		if (!colors) continue;

		const sgr: number[] = [];
		const fgCode = bsdCharToAnsiFg(colors.fg);
		const bgCode = bsdCharToAnsiBg(colors.bg);

		if (fgCode !== null) sgr.push(fgCode);
		if (includeBackground && bgCode !== null) sgr.push(bgCode);

		out.set(slot, { codes: sgr });
	}

	if (includeExtraDefaults) {
		const defaults = opts.extraDefaults ?? { or: '31', mi: '31' };
		for (const [k, v] of Object.entries(defaults)) {
			out.set(k, parseSgr(v));
		}
	}

	return stringifyLsColors(out);
}

// -------------------------
// LS_COLORS → LSCOLORS
// -------------------------

export interface LsColorsToLscolorsOptions {
	/** Fallback LSCOLORS string for missing slots (default: all x) */
	fallbackLscolors?: string;
}

const DEFAULT_LSCOLORS = 'xxxxxxxxxxxxxxxxxxxxxx'; // 22 x's

export function lsColorsToLscolors(
	lsColors: string,
	opts: LsColorsToLscolorsOptions = {},
): string {
	const fallback = opts.fallbackLscolors ?? DEFAULT_LSCOLORS;
	const fallbackMap = parseLscolors(fallback);
	const map = parseLsColors(lsColors);
	const out = new Map<BsdSlot, BsdSlotColors>();

	for (const slot of BSD_SLOTS) {
		const st = map.get(slot);
		if (!st) {
			const fb = fallbackMap.get(slot);
			if (fb) out.set(slot, fb);
			else out.set(slot, { fg: 'x', bg: 'x' });
			continue;
		}

		let fgChar = ansiStyleToBsdFgChar(st);
		let bgChar = ansiStyleToBsdBgChar(st);
		// Reverse video (07): swap fg and bg
		if (st.codes.includes(7)) {
			[fgChar, bgChar] = [bgChar, fgChar];
		}
		out.set(slot, { fg: fgChar, bg: bgChar });
	}

	return stringifyLscolors(out);
}

// -------------------------
// ANSI → BSD char helpers
// -------------------------

function ansiStyleToBsdFgChar(st: Style): string {
	// Last-wins: use findLast so later codes override earlier ones (e.g. 34;35 → magenta)
	const basic = st.codes.findLast((c) => (c >= 30 && c <= 37) || (c >= 90 && c <= 97));
	if (basic !== undefined) {
		let ch = ansiFgToBsdChar(basic);
		// Bold (01) → uppercase BSD char (e.g. bold blue 01;34 → 'E')
		if (st.codes.includes(1) && ch !== 'x') ch = ch.toUpperCase();
		return ch;
	}

	if (st.fg256 !== undefined) {
		const approx = approx256ToAnsi16Fg(st.fg256);
		let ch = ansiFgToBsdChar(approx);
		if (st.codes.includes(1) && ch !== 'x') ch = ch.toUpperCase();
		return ch;
	}

	// 39 = default fg
	if (st.codes.includes(39)) return 'x';
	return 'x';
}

function ansiStyleToBsdBgChar(st: Style): string {
	// Last-wins: use findLast so later codes override earlier ones
	const basic = st.codes.findLast((c) => (c >= 40 && c <= 47) || (c >= 100 && c <= 107));
	if (basic !== undefined) return ansiBgToBsdChar(basic);

	if (st.bg256 !== undefined) {
		const approx = approx256ToAnsi16Bg(st.bg256);
		return ansiBgToBsdChar(approx);
	}

	// 49 = default bg
	if (st.codes.includes(49)) return 'x';
	return 'x';
}

// -------------------------
// 256-color → 16-color approximation
// -------------------------

function approx256ToAnsi16Fg(idx: number): number {
	const [r, g, b] = xterm256ToRgb(idx);
	return rgbToNearestAnsi16Fg(r, g, b);
}

function approx256ToAnsi16Bg(idx: number): number {
	const [r, g, b] = xterm256ToRgb(idx);
	return rgbToNearestAnsi16Bg(r, g, b);
}

/** Standard xterm system color RGB values (indices 0-15) */
const SYSTEM_COLORS: readonly (readonly [number, number, number])[] = [
	[0, 0, 0],
	[205, 0, 0],
	[0, 205, 0],
	[205, 205, 0],
	[0, 0, 238],
	[205, 0, 205],
	[0, 205, 205],
	[229, 229, 229],
	[127, 127, 127],
	[255, 0, 0],
	[0, 255, 0],
	[255, 255, 0],
	[92, 92, 255],
	[255, 0, 255],
	[0, 255, 255],
	[255, 255, 255],
] as const;

/** Convert xterm 256-color index to RGB triplet */
export function xterm256ToRgb(idx: number): readonly [number, number, number] {
	// 0-15: system colors
	if (idx >= 0 && idx <= 15) {
		return SYSTEM_COLORS[idx] ?? [128, 128, 128];
	}

	// 16-231: 6x6x6 color cube
	if (idx >= 16 && idx <= 231) {
		const n = idx - 16;
		const ri = Math.floor(n / 36);
		const gi = Math.floor((n % 36) / 6);
		const bi = n % 6;
		const conv = (v: number): number => (v === 0 ? 0 : 55 + v * 40);
		return [conv(ri), conv(gi), conv(bi)] as const;
	}

	// 232-255: grayscale ramp
	if (idx >= 232 && idx <= 255) {
		const v = 8 + (idx - 232) * 10;
		return [v, v, v] as const;
	}

	// out of range
	return [128, 128, 128] as const;
}

// ANSI fg code → approximate RGB for distance calculation
const ANSI16_FG_CANDIDATES: readonly (readonly [number, readonly [number, number, number]])[] = [
	[30, [0, 0, 0]],
	[31, [205, 0, 0]],
	[32, [0, 205, 0]],
	[33, [205, 205, 0]],
	[34, [0, 0, 238]],
	[35, [205, 0, 205]],
	[36, [0, 205, 205]],
	[37, [229, 229, 229]],
	[90, [127, 127, 127]],
	[91, [255, 0, 0]],
	[92, [0, 255, 0]],
	[93, [255, 255, 0]],
	[94, [92, 92, 255]],
	[95, [255, 0, 255]],
	[96, [0, 255, 255]],
	[97, [255, 255, 255]],
] as const;

function rgbToNearestAnsi16Fg(r: number, g: number, b: number): number {
	let best = 30;
	let bestDist = Infinity;
	for (const [code, [cr, cg, cb]] of ANSI16_FG_CANDIDATES) {
		const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
		if (d < bestDist) {
			bestDist = d;
			best = code;
		}
	}
	return best;
}

function rgbToNearestAnsi16Bg(r: number, g: number, b: number): number {
	const fg: number = rgbToNearestAnsi16Fg(r, g, b);
	if (fg >= 90) return 100 + (fg - 90);
	return 40 + (fg - 30);
}

// -------------------------
// BSD char → CSS color (for preview rendering)
// -------------------------

/** Map a BSD LSCOLORS character to a CSS hex color string, or null for default */
export function bsdCharToCssColor(ch: string): CssColor {
	const idx = BSD_FG_CHARS.indexOf(ch);
	if (idx !== -1) {
		const rgb = SYSTEM_COLORS[idx];
		return rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : null;
	}
	const brightIdx = BSD_FG_BRIGHT_CHARS.indexOf(ch);
	if (brightIdx !== -1) {
		const rgb = SYSTEM_COLORS[8 + brightIdx];
		return rgb ? rgbToHex(rgb[0], rgb[1], rgb[2]) : null;
	}
	// 'x' or unknown → null (use terminal/theme default)
	return null;
}

/** Convert xterm 256-color index to CSS hex string */
export function xterm256ToCssHex(idx: number): string {
	const [r, g, b] = xterm256ToRgb(idx);
	return rgbToHex(r, g, b);
}

function rgbToHex(r: number, g: number, b: number): string {
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/** Parse an LSCOLORS string and return CSS colors for each BSD slot */
export function lscolorsToCssMap(lscolors: string): Map<BsdSlot, SlotCssColors> {
	const slots = parseLscolors(lscolors);
	const result = new Map<BsdSlot, SlotCssColors>();
	for (const [slot, colors] of slots) {
		result.set(slot, {
			fg: bsdCharToCssColor(colors.fg),
			bg: bsdCharToCssColor(colors.bg),
		});
	}
	return result;
}
