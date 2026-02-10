import { describe, expect, it } from 'vitest';
import { isValidBsdChar, parseLscolors, stringifyLscolors } from './bsd.ts';
import { BSD_SLOTS } from './types.ts';

describe('parseLscolors', () => {
	it('parses valid 22-char LSCOLORS', () => {
		const map = parseLscolors('exfxcxdxbxegedabagacad');
		expect(map.size).toBe(11);
		expect(map.get('di')).toEqual({ fg: 'e', bg: 'x' });
		expect(map.get('ln')).toEqual({ fg: 'f', bg: 'x' });
		expect(map.get('so')).toEqual({ fg: 'c', bg: 'x' });
		expect(map.get('pi')).toEqual({ fg: 'd', bg: 'x' });
		expect(map.get('ex')).toEqual({ fg: 'b', bg: 'x' });
		expect(map.get('bd')).toEqual({ fg: 'e', bg: 'g' });
		expect(map.get('cd')).toEqual({ fg: 'e', bg: 'd' });
		expect(map.get('su')).toEqual({ fg: 'a', bg: 'b' });
		expect(map.get('sg')).toEqual({ fg: 'a', bg: 'g' });
		expect(map.get('tw')).toEqual({ fg: 'a', bg: 'c' });
		expect(map.get('ow')).toEqual({ fg: 'a', bg: 'd' });
	});

	it('throws on wrong length', () => {
		expect(() => parseLscolors('abc')).toThrow('LSCOLORS must be exactly 22 chars');
		expect(() => parseLscolors('')).toThrow('LSCOLORS must be exactly 22 chars');
	});

	it('throws on invalid BSD chars', () => {
		expect(() => parseLscolors('zxfxcxdxbxegedabagacad')).toThrow('Invalid BSD color char');
	});

	it('parses all-default LSCOLORS', () => {
		const map = parseLscolors('xxxxxxxxxxxxxxxxxxxxxx');
		for (const slot of BSD_SLOTS) {
			expect(map.get(slot)).toEqual({ fg: 'x', bg: 'x' });
		}
	});

	it('parses bright/uppercase chars', () => {
		const map = parseLscolors('ExFxCxDxBxEGEDABAGACAD');
		expect(map.get('di')).toEqual({ fg: 'E', bg: 'x' });
		expect(map.get('ln')).toEqual({ fg: 'F', bg: 'x' });
	});
});

describe('stringifyLscolors', () => {
	it('round-trips with parseLscolors', () => {
		const original = 'exfxcxdxbxegedabagacad';
		const map = parseLscolors(original);
		expect(stringifyLscolors(map)).toBe(original);
	});

	it('round-trips all-default', () => {
		const original = 'xxxxxxxxxxxxxxxxxxxxxx';
		const map = parseLscolors(original);
		expect(stringifyLscolors(map)).toBe(original);
	});

	it('fills missing slots with x', () => {
		const map = new Map();
		expect(stringifyLscolors(map)).toBe('xxxxxxxxxxxxxxxxxxxxxx');
	});
});

describe('isValidBsdChar', () => {
	it('accepts lowercase a-h', () => {
		for (const ch of 'abcdefgh') {
			expect(isValidBsdChar(ch)).toBe(true);
		}
	});

	it('accepts uppercase A-H', () => {
		for (const ch of 'ABCDEFGH') {
			expect(isValidBsdChar(ch)).toBe(true);
		}
	});

	it('accepts x', () => {
		expect(isValidBsdChar('x')).toBe(true);
	});

	it('rejects invalid chars', () => {
		expect(isValidBsdChar('z')).toBe(false);
		expect(isValidBsdChar('0')).toBe(false);
		expect(isValidBsdChar('i')).toBe(false);
		expect(isValidBsdChar('X')).toBe(false);
	});
});
