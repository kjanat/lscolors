import { describe, expect, it } from 'vitest';
import {
	BSD_SLOTS,
	isValidBsdChar,
	lsColorsToLscolors,
	lscolorsToLsColors,
	parseLsColors,
	parseLscolors,
	parseSgr,
	stringifyLsColors,
	stringifyLscolors,
	stringifySgr,
	xterm256ToRgb,
} from './lscolors';

// -------------------------
// parseSgr / stringifySgr
// -------------------------

describe('parseSgr', () => {
	it('parses empty string as no style', () => {
		expect(parseSgr('')).toEqual({ codes: [] });
	});

	it('parses single code', () => {
		expect(parseSgr('34')).toEqual({ codes: [34] });
	});

	it('parses multiple codes', () => {
		expect(parseSgr('01;34')).toEqual({ codes: [1, 34] });
	});

	it('parses 256-color foreground', () => {
		const st = parseSgr('38;5;200');
		expect(st.codes).toEqual([]);
		expect(st.fg256).toBe(200);
	});

	it('parses 256-color background', () => {
		const st = parseSgr('48;5;235');
		expect(st.codes).toEqual([]);
		expect(st.bg256).toBe(235);
	});

	it('parses mixed: bold + 256-color fg + 256-color bg', () => {
		const st = parseSgr('01;38;5;200;48;5;235');
		expect(st.codes).toEqual([1]);
		expect(st.fg256).toBe(200);
		expect(st.bg256).toBe(235);
	});

	it('handles whitespace in segments', () => {
		expect(parseSgr(' 01 ; 34 ')).toEqual({ codes: [1, 34] });
	});

	it('ignores non-finite values', () => {
		expect(parseSgr('34;NaN;32')).toEqual({ codes: [34, 32] });
	});
});

describe('stringifySgr', () => {
	it('stringifies simple codes', () => {
		expect(stringifySgr({ codes: [1, 34] })).toBe('1;34');
	});

	it('stringifies empty codes', () => {
		expect(stringifySgr({ codes: [] })).toBe('');
	});

	it('appends 256-color sequences', () => {
		expect(stringifySgr({ codes: [1], fg256: 200, bg256: 235 })).toBe('1;38;5;200;48;5;235');
	});

	it('round-trips through parseSgr', () => {
		const original = '01;38;5;200;48;5;235';
		const parsed = parseSgr(original);
		expect(stringifySgr(parsed)).toBe('1;38;5;200;48;5;235');
	});
});

// -------------------------
// parseLsColors / stringifyLsColors
// -------------------------

describe('parseLsColors', () => {
	it('parses empty string', () => {
		expect(parseLsColors('')).toEqual(new Map());
	});

	it('parses single key=value', () => {
		const map = parseLsColors('di=01;34');
		expect(map.size).toBe(1);
		expect(map.get('di')).toEqual({ codes: [1, 34] });
	});

	it('parses multiple entries', () => {
		const map = parseLsColors('di=01;34:ln=01;36:ex=01;32');
		expect(map.size).toBe(3);
		expect(map.get('di')).toEqual({ codes: [1, 34] });
		expect(map.get('ln')).toEqual({ codes: [1, 36] });
		expect(map.get('ex')).toEqual({ codes: [1, 32] });
	});

	it('handles trailing colon', () => {
		const map = parseLsColors('di=34:');
		expect(map.size).toBe(1);
	});

	it('skips entries without =', () => {
		const map = parseLsColors('di=34:garbage:ln=36');
		expect(map.size).toBe(2);
	});

	it('handles file extension keys', () => {
		const map = parseLsColors('*.tar=31:*.gz=31');
		expect(map.size).toBe(2);
		expect(map.get('*.tar')).toEqual({ codes: [31] });
	});
});

describe('stringifyLsColors', () => {
	it('round-trips through parseLsColors', () => {
		const input = 'di=1;34:ln=1;36:ex=1;32';
		const map = parseLsColors(input);
		expect(stringifyLsColors(map)).toBe(input);
	});
});

// -------------------------
// parseLscolors / stringifyLscolors
// -------------------------

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

// -------------------------
// isValidBsdChar
// -------------------------

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

// -------------------------
// lscolorsToLsColors (LSCOLORS -> LS_COLORS)
// -------------------------

describe('lscolorsToLsColors', () => {
	it('converts macOS default LSCOLORS', () => {
		const result = lscolorsToLsColors('exfxcxdxbxegedabagacad');
		const map = parseLsColors(result);

		// di=e(blue)x(default) -> 34
		expect(map.get('di')?.codes).toEqual([34]);
		// ln=f(magenta)x -> 35
		expect(map.get('ln')?.codes).toEqual([35]);
		// ex=b(red)x -> 31
		expect(map.get('ex')?.codes).toEqual([31]);
		// bd=e(blue)g(cyan bg) -> 34;46
		expect(map.get('bd')?.codes).toEqual([34, 46]);
	});

	it('includes or/mi defaults by default', () => {
		const result = lscolorsToLsColors('xxxxxxxxxxxxxxxxxxxxxx');
		const map = parseLsColors(result);
		expect(map.has('or')).toBe(true);
		expect(map.has('mi')).toBe(true);
	});

	it('excludes extra defaults when disabled', () => {
		const result = lscolorsToLsColors('xxxxxxxxxxxxxxxxxxxxxx', {
			includeExtraDefaults: false,
		});
		const map = parseLsColors(result);
		expect(map.has('or')).toBe(false);
		expect(map.has('mi')).toBe(false);
	});

	it('excludes background when disabled', () => {
		const result = lscolorsToLsColors('exfxcxdxbxegedabagacad', {
			includeBackground: false,
			includeExtraDefaults: false,
		});
		const map = parseLsColors(result);
		// bd=e(blue)g(cyan bg) -> should only have fg=34, no bg
		const bd = map.get('bd');
		expect(bd?.codes).toEqual([34]);
	});

	it('produces empty codes for default-only slots', () => {
		const result = lscolorsToLsColors('xxxxxxxxxxxxxxxxxxxxxx', {
			includeExtraDefaults: false,
		});
		const map = parseLsColors(result);
		for (const slot of BSD_SLOTS) {
			expect(map.get(slot)?.codes).toEqual([]);
		}
	});

	it('handles bright colors (uppercase chars)', () => {
		const result = lscolorsToLsColors('Exfxcxdxbxegedabagacad', {
			includeExtraDefaults: false,
		});
		const map = parseLsColors(result);
		expect(map.get('di')?.codes).toEqual([94]);
	});
});

// -------------------------
// lsColorsToLscolors (LS_COLORS -> LSCOLORS)
// -------------------------

describe('lsColorsToLscolors', () => {
	it('converts basic LS_COLORS', () => {
		const result = lsColorsToLscolors('di=34:ln=36:ex=32');
		const map = parseLscolors(result);
		expect(map.get('di')).toEqual({ fg: 'e', bg: 'x' });
		expect(map.get('ln')).toEqual({ fg: 'g', bg: 'x' });
		expect(map.get('ex')).toEqual({ fg: 'c', bg: 'x' });
	});

	it('converts bold+color (ignores bold, keeps color)', () => {
		const result = lsColorsToLscolors('di=01;34');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('e');
	});

	it('converts background colors', () => {
		const result = lsColorsToLscolors('tw=30;42');
		const map = parseLscolors(result);
		expect(map.get('tw')).toEqual({ fg: 'a', bg: 'c' });
	});

	it('converts bright/high-intensity colors', () => {
		const result = lsColorsToLscolors('di=94:ln=96');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('E');
		expect(map.get('ln')?.fg).toBe('G');
	});

	it('uses fallback for missing slots', () => {
		const result = lsColorsToLscolors('di=34');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('e');
		expect(map.get('ln')).toEqual({ fg: 'x', bg: 'x' });
		expect(map.get('ex')).toEqual({ fg: 'x', bg: 'x' });
	});

	it('uses custom fallback LSCOLORS', () => {
		const result = lsColorsToLscolors('', {
			fallbackLscolors: 'exfxcxdxbxegedabagacad',
		});
		expect(result).toBe('exfxcxdxbxegedabagacad');
	});

	it('returns all-default for empty input', () => {
		expect(lsColorsToLscolors('')).toBe('xxxxxxxxxxxxxxxxxxxxxx');
	});

	it('ignores non-overlapping keys', () => {
		const result = lsColorsToLscolors('di=34:*.tar=31:or=31');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('e');
	});

	it('handles 256-color foreground', () => {
		const result = lsColorsToLscolors('di=38;5;1');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('b');
	});

	it('handles 256-color background', () => {
		const result = lsColorsToLscolors('di=34;48;5;4');
		const map = parseLscolors(result);
		expect(map.get('di')?.bg).toBe('e');
	});

	it('handles default fg code (39)', () => {
		const result = lsColorsToLscolors('di=39');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('x');
	});

	it('handles default bg code (49)', () => {
		const result = lsColorsToLscolors('di=34;49');
		const map = parseLscolors(result);
		expect(map.get('di')?.bg).toBe('x');
	});
});

// -------------------------
// Round-trip identity
// -------------------------

describe('round-trip', () => {
	it('LSCOLORS -> LS_COLORS -> LSCOLORS preserves basic colors', () => {
		const original = 'exfxcxdxbxegedabagacad';
		const lsColors = lscolorsToLsColors(original, { includeExtraDefaults: false });
		const roundTripped = lsColorsToLscolors(lsColors);
		expect(roundTripped).toBe(original);
	});

	it('round-trips all-default', () => {
		const original = 'xxxxxxxxxxxxxxxxxxxxxx';
		const lsColors = lscolorsToLsColors(original, { includeExtraDefaults: false });
		const roundTripped = lsColorsToLscolors(lsColors);
		expect(roundTripped).toBe(original);
	});

	it('round-trips bright colors', () => {
		const original = 'ExFxCxDxBxEGEDABAGACAD';
		const lsColors = lscolorsToLsColors(original, { includeExtraDefaults: false });
		const roundTripped = lsColorsToLscolors(lsColors);
		expect(roundTripped).toBe(original);
	});
});

// -------------------------
// xterm256ToRgb
// -------------------------

describe('xterm256ToRgb', () => {
	it('maps system colors correctly', () => {
		expect(xterm256ToRgb(0)).toEqual([0, 0, 0]);
		expect(xterm256ToRgb(1)).toEqual([205, 0, 0]);
		expect(xterm256ToRgb(15)).toEqual([255, 255, 255]);
	});

	it('maps color cube correctly', () => {
		expect(xterm256ToRgb(16)).toEqual([0, 0, 0]);
		expect(xterm256ToRgb(196)).toEqual([255, 0, 0]);
		expect(xterm256ToRgb(21)).toEqual([0, 0, 255]);
	});

	it('maps grayscale ramp correctly', () => {
		expect(xterm256ToRgb(232)).toEqual([8, 8, 8]);
		expect(xterm256ToRgb(255)).toEqual([238, 238, 238]);
	});

	it('returns fallback for out-of-range', () => {
		expect(xterm256ToRgb(256)).toEqual([128, 128, 128]);
		expect(xterm256ToRgb(-1)).toEqual([128, 128, 128]);
	});
});

// -------------------------
// 256-color approximation via conversion
// -------------------------

describe('256-color approximation', () => {
	it('approximates pure red (index 9) -> bright red (B)', () => {
		const result = lsColorsToLscolors('di=38;5;9');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('B');
	});

	it('approximates pure blue (index 4) -> blue (e)', () => {
		const result = lsColorsToLscolors('di=38;5;4');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('e');
	});

	it('approximates white (index 15) -> bright white (H)', () => {
		const result = lsColorsToLscolors('di=38;5;15');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('H');
	});

	it('approximates color cube red (index 196) -> bright red (B)', () => {
		const result = lsColorsToLscolors('di=38;5;196');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('B');
	});

	it('approximates grayscale dark (index 232) -> black (a)', () => {
		const result = lsColorsToLscolors('di=38;5;232');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('a');
	});
});
