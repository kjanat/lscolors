/**
 * ANSI SGR (Select Graphic Rendition) parsing and formatting.
 *
 * Handles basic attribute codes and 256-color extended sequences (38;5;N / 48;5;N).
 */

import type { Style } from './types.ts';

/** Parse a semicolon-delimited SGR string into a {@link Style} */
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

/** Serialize a {@link Style} back to an SGR string */
export function stringifySgr(st: Style): string {
	const out: number[] = [...st.codes];
	if (st.fg256 !== undefined) out.push(38, 5, st.fg256);
	if (st.bg256 !== undefined) out.push(48, 5, st.bg256);
	return out.map(String).join(';');
}
