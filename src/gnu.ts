/**
 * GNU LS_COLORS (dircolors format) parsing and formatting.
 *
 * Format: colon-delimited `key=sgr_codes` pairs, e.g. `di=01;34:ln=01;36:*.tar=31`.
 */

import { parseSgr, stringifySgr } from './sgr.ts';
import type { Style } from './types.ts';

/** Parse a GNU LS_COLORS string into a Map of key → {@link Style} */
export function parseLsColors(lsColors: string): Map<string, Style> {
	const map = new Map<string, Style>();
	if (!lsColors) return map;

	for (const part of lsColors.split(':')) {
		if (!part) continue;
		const eq: number = part.indexOf('=');
		if (eq === -1) continue;
		const key: string = part.slice(0, eq).trim();
		const value: string = part.slice(eq + 1).trim();
		if (!key) continue;
		map.set(key, parseSgr(value));
	}
	return map;
}

/** Serialize a Map of key → {@link Style} back to GNU LS_COLORS format */
export function stringifyLsColors(map: Map<string, Style>): string {
	const parts: string[] = [];
	for (const [k, st] of map.entries()) {
		parts.push(`${k}=${stringifySgr(st)}`);
	}
	return parts.join(':');
}
