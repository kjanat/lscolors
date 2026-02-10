import { describe, expect, it } from 'vitest';
import { decodeHash, encodeHash, type HashState } from './hash.ts';

describe('encodeHash', () => {
	it('returns empty string for empty value', () => {
		expect(encodeHash({ source: 'lscolors-to-ls_colors', value: '' })).toBe('');
	});

	it('encodes LSCOLORS value', () => {
		expect(encodeHash({ source: 'lscolors-to-ls_colors', value: 'exfxcxdxbxegedabagacad' }))
			.toBe('#lscolors=exfxcxdxbxegedabagacad');
	});

	it('does not encode :;= in LS_COLORS fragments (RFC 3986)', () => {
		const state: HashState = { source: 'ls_colors-to-lscolors', value: 'di=01;34:ln=35' };
		expect(encodeHash(state)).toBe('#ls_colors=di=01;34:ln=35');
	});

	it('encodes unsafe chars like # and space', () => {
		const state: HashState = { source: 'ls_colors-to-lscolors', value: 'di=01#bad value' };
		expect(encodeHash(state)).toBe('#ls_colors=di=01%23bad%20value');
	});

	it('produces shorter output than encodeURIComponent for typical LS_COLORS', () => {
		const value = 'di=01;34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=34;43';
		const encoded = encodeHash({ source: 'ls_colors-to-lscolors', value });
		const naive = `#ls_colors=${encodeURIComponent(value)}`;
		expect(encoded.length).toBeLessThan(naive.length);
	});
});

describe('decodeHash', () => {
	it('returns null for empty hash', () => {
		expect(decodeHash('')).toBeNull();
	});

	it('returns null for bare #', () => {
		expect(decodeHash('#')).toBeNull();
	});

	it('returns null for unknown key', () => {
		expect(decodeHash('#unknown=foo')).toBeNull();
	});

	it('returns null for empty value', () => {
		expect(decodeHash('#lscolors=')).toBeNull();
	});

	it('decodes LSCOLORS hash', () => {
		expect(decodeHash('#lscolors=exfxcxdxbxegedabagacad')).toEqual({
			source: 'lscolors-to-ls_colors',
			value: 'exfxcxdxbxegedabagacad',
		});
	});

	it('decodes new-format LS_COLORS hash (unencoded :;=)', () => {
		expect(decodeHash('#ls_colors=di=01;34:ln=35')).toEqual({
			source: 'ls_colors-to-lscolors',
			value: 'di=01;34:ln=35',
		});
	});

	it('backward compat: decodes old-format LS_COLORS hash (%xx encoded)', () => {
		expect(decodeHash('#ls_colors=di%3D01%3B34%3Aln%3D35')).toEqual({
			source: 'ls_colors-to-lscolors',
			value: 'di=01;34:ln=35',
		});
	});
});

describe('encodeHash/decodeHash roundtrip', () => {
	const cases: HashState[] = [
		{ source: 'lscolors-to-ls_colors', value: 'exfxcxdxbxegedabagacad' },
		{ source: 'ls_colors-to-lscolors', value: 'di=01;34:ln=35:so=32:pi=33:ex=31' },
		{ source: 'ls_colors-to-lscolors', value: 'di=38;5;200:ln=38;2;255;128;0' },
		{ source: 'lscolors-to-ls_colors', value: 'ExGxCxDxBxEGEDABAGACAD' },
	];

	for (const state of cases) {
		it(`roundtrips ${state.source} "${state.value.slice(0, 30)}..."`, () => {
			const hash = encodeHash(state);
			expect(decodeHash(hash)).toEqual(state);
		});
	}
});
