/**
 * Pure logic helpers for the preview table.
 *
 * Keeps sample text, SGR formatting, and hex display logic
 * separate from the Svelte component template.
 */

import { bsdCharToAnsiBg, bsdCharToAnsiFg } from '../bsd.ts';
import type { BsdSlot } from '../types.ts';

/** Sample filenames shown in the preview for each slot */
export const SLOT_SAMPLE_TEXT: Readonly<Record<BsdSlot, string>> = {
	di: 'Documents/',
	ln: 'link -> target',
	so: 'app.sock',
	pi: 'fifo.pipe',
	ex: 'run.sh',
	bd: 'sda1',
	cd: 'tty0',
	su: 'passwd',
	sg: 'crontab',
	tw: 'tmp/',
	ow: 'shared/',
};

/** Default foreground when BSD char is 'x' (terminal default fg) */
export const DEFAULT_FG = '#e0e0e0';
/** Default background when BSD char is 'x' (transparent / terminal bg) */
export const DEFAULT_BG = 'transparent';

/** Build SGR string from a BSD fg/bg char pair */
export function bsdCharsToSgr(fg: string, bg: string): string {
	const parts: number[] = [];
	const fgCode = bsdCharToAnsiFg(fg);
	const bgCode = bsdCharToAnsiBg(bg);
	if (fgCode !== null) parts.push(fgCode);
	if (bgCode !== null) parts.push(bgCode);
	return parts.map(String).join(';');
}

/** Format fg/bg hex colors as a compact string */
export function formatHex(fg: string | null, bg: string | null): string {
	const fgStr = fg ?? '\u2014';
	const bgStr = bg ?? '\u2014';
	if (bgStr === '\u2014') return fgStr;
	return `${fgStr} / ${bgStr}`;
}
