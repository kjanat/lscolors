// lscolors.ts
// Two-way converter between BSD/macOS LSCOLORS and GNU LS_COLORS (dircolors format)

export type BsdSlot = 'di' | 'ln' | 'so' | 'pi' | 'ex' | 'bd' | 'cd' | 'su' | 'sg' | 'tw' | 'ow';

export const BSD_SLOTS: readonly BsdSlot[] = [
	'di',
	'ln',
	'so',
	'pi',
	'ex',
	'bd',
	'cd',
	'su',
	'sg',
	'tw',
	'ow',
] as const;

/** Human-readable labels for each BSD slot */
export const BSD_SLOT_LABELS: Readonly<Record<BsdSlot, string>> = {
	di: 'Directory',
	ln: 'Symbolic link',
	so: 'Socket',
	pi: 'Pipe (FIFO)',
	ex: 'Executable',
	bd: 'Block device',
	cd: 'Character device',
	su: 'Setuid (u+s)',
	sg: 'Setgid (g+s)',
	tw: 'Sticky + other-writable',
	ow: 'Other-writable',
};

// BSD LSCOLORS char → ANSI SGR code mappings
// a-h => basic colors (30-37 fg, 40-47 bg)
// A-H => bright/high-intensity (90-97 fg, 100-107 bg)
// x   => default (null)

const BSD_FG_CHARS = 'abcdefgh' as const;
const BSD_FG_BRIGHT_CHARS = 'ABCDEFGH' as const;

function bsdCharToAnsiFg(ch: string): number | null {
	const idx = BSD_FG_CHARS.indexOf(ch);
	if (idx !== -1) return 30 + idx;
	const brightIdx = BSD_FG_BRIGHT_CHARS.indexOf(ch);
	if (brightIdx !== -1) return 90 + brightIdx;
	return null; // 'x' or unknown
}

function bsdCharToAnsiBg(ch: string): number | null {
	const idx = BSD_FG_CHARS.indexOf(ch);
	if (idx !== -1) return 40 + idx;
	const brightIdx = BSD_FG_BRIGHT_CHARS.indexOf(ch);
	if (brightIdx !== -1) return 100 + brightIdx;
	return null;
}

function ansiFgToBsdChar(code: number): string {
	if (code >= 30 && code <= 37) return BSD_FG_CHARS[code - 30] ?? 'x';
	if (code >= 90 && code <= 97) return BSD_FG_BRIGHT_CHARS[code - 90] ?? 'x';
	return 'x';
}

function ansiBgToBsdChar(code: number): string {
	if (code >= 40 && code <= 47) return BSD_FG_CHARS[code - 40] ?? 'x';
	if (code >= 100 && code <= 107) return BSD_FG_BRIGHT_CHARS[code - 100] ?? 'x';
	return 'x';
}

// -------------------------
// Style type
// -------------------------

export interface Style {
	/** SGR attribute codes (e.g. [1, 34] for bold blue) */
	codes: readonly number[];
	/** 256-color foreground index, if present */
	fg256?: number;
	/** 256-color background index, if present */
	bg256?: number;
}

// -------------------------
// SGR parsing / formatting
// -------------------------

export function parseSgr(s: string): Style {
	if (!s) return { codes: [] };

	const nums = s
		.split(';')
		.map((x) => x.trim())
		.filter(Boolean)
		.map(Number)
		.filter(Number.isFinite);

	const codes: number[] = [];
	let fg256: number | undefined;
	let bg256: number | undefined;

	for (let i = 0; i < nums.length; i++) {
		const n = nums[i];
		if (n === undefined) continue;

		// 38;5;<idx> = 256-color foreground
		if (n === 38 && nums[i + 1] === 5 && nums[i + 2] !== undefined && Number.isFinite(nums[i + 2])) {
			fg256 = nums[i + 2];
			i += 2;
			continue;
		}
		// 48;5;<idx> = 256-color background
		if (n === 48 && nums[i + 1] === 5 && nums[i + 2] !== undefined && Number.isFinite(nums[i + 2])) {
			bg256 = nums[i + 2];
			i += 2;
			continue;
		}

		codes.push(n);
	}

	const result: Style = { codes };
	if (fg256 !== undefined) result.fg256 = fg256;
	if (bg256 !== undefined) result.bg256 = bg256;
	return result;
}

export function stringifySgr(st: Style): string {
	const out: number[] = [...st.codes];
	if (st.fg256 !== undefined) out.push(38, 5, st.fg256);
	if (st.bg256 !== undefined) out.push(48, 5, st.bg256);
	return out.map(String).join(';');
}

// -------------------------
// LS_COLORS parsing / formatting (GNU dircolors format)
// -------------------------

export function parseLsColors(lsColors: string): Map<string, Style> {
	const map = new Map<string, Style>();
	if (!lsColors) return map;

	for (const part of lsColors.split(':')) {
		if (!part) continue;
		const eq = part.indexOf('=');
		if (eq === -1) continue;
		const key = part.slice(0, eq).trim();
		const value = part.slice(eq + 1).trim();
		if (!key) continue;
		map.set(key, parseSgr(value));
	}
	return map;
}

export function stringifyLsColors(map: Map<string, Style>): string {
	const parts: string[] = [];
	for (const [k, st] of map.entries()) {
		parts.push(`${k}=${stringifySgr(st)}`);
	}
	return parts.join(':');
}

// -------------------------
// LSCOLORS parsing / formatting (BSD/macOS format)
// -------------------------

export interface BsdSlotColors {
	readonly fg: string;
	readonly bg: string;
}

const VALID_BSD_CHARS = new Set('abcdefghABCDEFGHx');

export function isValidBsdChar(ch: string): boolean {
	return VALID_BSD_CHARS.has(ch);
}

export function parseLscolors(lscolors: string): Map<BsdSlot, BsdSlotColors> {
	if (lscolors.length !== 22) {
		throw new Error(`LSCOLORS must be exactly 22 chars (got ${String(lscolors.length)})`);
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
		throw new Error(`Internal error: produced invalid LSCOLORS length (${String(out.length)})`);
	}
	return out;
}

// -------------------------
// Conversion: LSCOLORS → LS_COLORS
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
// Conversion: LS_COLORS → LSCOLORS
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

		const fgChar = ansiStyleToBsdFgChar(st);
		const bgChar = ansiStyleToBsdBgChar(st);
		out.set(slot, { fg: fgChar, bg: bgChar });
	}

	return stringifyLscolors(out);
}

// -------------------------
// ANSI → BSD char helpers
// -------------------------

function ansiStyleToBsdFgChar(st: Style): string {
	const basic = st.codes.find((c) => (c >= 30 && c <= 37) || (c >= 90 && c <= 97));
	if (basic !== undefined) return ansiFgToBsdChar(basic);

	if (st.fg256 !== undefined) {
		const approx = approx256ToAnsi16Fg(st.fg256);
		return ansiFgToBsdChar(approx);
	}

	// 39 = default fg
	if (st.codes.includes(39)) return 'x';
	return 'x';
}

function ansiStyleToBsdBgChar(st: Style): string {
	const basic = st.codes.find((c) => (c >= 40 && c <= 47) || (c >= 100 && c <= 107));
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

/** Approximate xterm 256-color index to nearest basic ANSI 16-color foreground code */
function approx256ToAnsi16Fg(idx: number): number {
	const [r, g, b] = xterm256ToRgb(idx);
	return rgbToNearestAnsi16Fg(r, g, b);
}

/** Approximate xterm 256-color index to nearest basic ANSI 16-color background code */
function approx256ToAnsi16Bg(idx: number): number {
	const [r, g, b] = xterm256ToRgb(idx);
	return rgbToNearestAnsi16Bg(r, g, b);
}

// Standard xterm system color RGB values
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
	const fg = rgbToNearestAnsi16Fg(r, g, b);
	if (fg >= 90) return 100 + (fg - 90);
	return 40 + (fg - 30);
}
