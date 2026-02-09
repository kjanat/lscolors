/** URL hash permalink encoding/decoding for sharing converter state */

/** Conversion direction: which field is the source of truth */
export type Direction = 'lscolors-to-ls_colors' | 'ls_colors-to-lscolors';

/** Hash format: #lscolors=<value> or #ls_colors=<value> */
export type HashState = {
	readonly source: Direction;
	readonly value: string;
};

export function encodeHash(state: HashState): string {
	if (state.value === '') return '';
	const key = state.source === 'lscolors-to-ls_colors' ? 'lscolors' : 'ls_colors';
	return `#${key}=${encodeURIComponent(state.value)}`;
}

export function decodeHash(hash: string): HashState | null {
	if (!hash.startsWith('#') || hash.length < 2) return null;
	const raw: string = hash.slice(1);
	const eqIdx: number = raw.indexOf('=');
	if (eqIdx === -1) return null;

	const key: string = raw.slice(0, eqIdx);
	const value: string = decodeURIComponent(raw.slice(eqIdx + 1));
	if (value === '') return null;

	if (key === 'lscolors') {
		return { source: 'lscolors-to-ls_colors', value };
	}
	if (key === 'ls_colors') {
		return { source: 'ls_colors-to-lscolors', value };
	}
	return null;
}
