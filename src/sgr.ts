/**
 * ANSI SGR (Select Graphic Rendition) parsing and formatting.
 *
 * Handles basic attribute codes, 256-color (38;5;N / 48;5;N),
 * and truecolor (38;2;r;g;b / 48;2;r;g;b) sequences.
 */

import type { Rgb, Style } from './types.ts';

/** Parse a semicolon-delimited SGR string into a {@link Style} */
export function parseSgr(s: string): Style {
	if (!s) return { codes: [] };

	const nums: number[] = s
		.split(';')
		.map((x: string): string => x.trim())
		.filter(Boolean)
		.map(Number)
		.filter(Number.isFinite);

	const codes: number[] = [];
	let fg256: number | undefined;
	let bg256: number | undefined;
	let fgRgb: Rgb | undefined;
	let bgRgb: Rgb | undefined;

	for (let i = 0; i < nums.length; i++) {
		const n = nums[i];
		if (n === undefined) continue;

		// 38;5;<idx> = 256-color foreground
		if (n === 38 && nums[i + 1] === 5 && nums[i + 2] !== undefined && Number.isFinite(nums[i + 2])) {
			fg256 = nums[i + 2];
			i += 2;
			continue;
		}
		// 38;2;<r>;<g>;<b> = truecolor foreground
		{
			const r = nums[i + 2];
			const g = nums[i + 3];
			const b = nums[i + 4];
			if (n === 38 && nums[i + 1] === 2 && r !== undefined && g !== undefined && b !== undefined) {
				fgRgb = [r, g, b];
				i += 4;
				continue;
			}
		}
		// 48;5;<idx> = 256-color background
		if (n === 48 && nums[i + 1] === 5 && nums[i + 2] !== undefined && Number.isFinite(nums[i + 2])) {
			bg256 = nums[i + 2];
			i += 2;
			continue;
		}
		// 48;2;<r>;<g>;<b> = truecolor background
		{
			const r = nums[i + 2];
			const g = nums[i + 3];
			const b = nums[i + 4];
			if (n === 48 && nums[i + 1] === 2 && r !== undefined && g !== undefined && b !== undefined) {
				bgRgb = [r, g, b];
				i += 4;
				continue;
			}
		}

		codes.push(n);
	}

	const result: Style = { codes };
	if (fg256 !== undefined) result.fg256 = fg256;
	if (bg256 !== undefined) result.bg256 = bg256;
	if (fgRgb !== undefined) result.fgRgb = fgRgb;
	if (bgRgb !== undefined) result.bgRgb = bgRgb;
	return result;
}

/** Serialize a {@link Style} back to an SGR string */
export function stringifySgr(st: Style): string {
	const out: number[] = [...st.codes];
	if (st.fg256 !== undefined) out.push(38, 5, st.fg256);
	if (st.fgRgb !== undefined) out.push(38, 2, ...st.fgRgb);
	if (st.bg256 !== undefined) out.push(48, 5, st.bg256);
	if (st.bgRgb !== undefined) out.push(48, 2, ...st.bgRgb);
	return out.map(String).join(';');
}
