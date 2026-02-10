import { describe, expect, it } from 'vitest';
import { parseLscolors } from './bsd.ts';
import {
	bsdCharToCssColor,
	lsColorsToLscolors,
	lscolorsToCssMap,
	lscolorsToLsColors,
	xterm256ToCssHex,
	xterm256ToRgb,
} from './convert.ts';
import { parseLsColors } from './gnu.ts';
import { BSD_SLOTS } from './types.ts';

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

	it('converts bold+color to uppercase BSD char', () => {
		const result = lsColorsToLscolors('di=01;34');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('E');
	});

	it('bold without color produces default (no uppercase x)', () => {
		const result = lsColorsToLscolors('di=01');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('x');
	});

	it('bold + 256-color produces uppercase', () => {
		// 38;5;4 = blue (index 4), bold should uppercase
		const result = lsColorsToLscolors('di=01;38;5;4');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('E');
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

	it('last fg code wins when multiple present', () => {
		// 34 (blue) then 35 (magenta) → magenta wins
		const result = lsColorsToLscolors('di=34;35');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('f');
	});

	it('last bg code wins when multiple present', () => {
		// 42 (green bg) then 44 (blue bg) → blue wins
		const result = lsColorsToLscolors('di=34;42;44');
		const map = parseLscolors(result);
		expect(map.get('di')?.bg).toBe('e');
	});

	it('reverse video (07) swaps fg and bg', () => {
		// blue fg + green bg + reverse → fg=green bg=blue → 'ce'
		const result = lsColorsToLscolors('di=34;42;7');
		const map = parseLscolors(result);
		expect(map.get('di')).toEqual({ fg: 'c', bg: 'e' });
	});

	it('reverse video with bold swaps after bold applied to fg', () => {
		// bold + blue fg + green bg + reverse → bold makes fg 'E', swap → fg='c' bg='E'
		const result = lsColorsToLscolors('di=01;34;42;7');
		const map = parseLscolors(result);
		expect(map.get('di')).toEqual({ fg: 'c', bg: 'E' });
	});

	it('reverse video with no bg swaps to default', () => {
		// blue fg + reverse → fg=default bg=blue → 'xe'
		const result = lsColorsToLscolors('di=34;7');
		const map = parseLscolors(result);
		expect(map.get('di')).toEqual({ fg: 'x', bg: 'e' });
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

	it('handles truecolor fg (38;2;r;g;b) → nearest 16-color', () => {
		// Pure red (255,0,0) → nearest is bright red (91) → 'B'
		const result = lsColorsToLscolors('di=38;2;255;0;0');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('B');
	});

	it('handles truecolor bg (48;2;r;g;b) → nearest 16-color', () => {
		// Pure blue truecolor bg → maps to blue bg (e)
		const result = lsColorsToLscolors('di=34;48;2;0;0;255');
		const map = parseLscolors(result);
		expect(map.get('di')?.bg).toBe('e');
	});

	it('bold + truecolor fg produces uppercase', () => {
		// Bold + pure green truecolor → maps to bright green (C)
		const result = lsColorsToLscolors('di=01;38;2;0;255;0');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('C');
	});

	it('truecolor fg + truecolor bg combined', () => {
		// Bright red fg + blue bg
		const result = lsColorsToLscolors('di=38;2;255;0;0;48;2;0;0;238');
		const map = parseLscolors(result);
		expect(map.get('di')?.fg).toBe('B');
		expect(map.get('di')?.bg).toBe('e');
	});

	it('reverse video with truecolor swaps fg/bg', () => {
		// Bright red truecolor fg + normal green truecolor bg + reverse
		const result = lsColorsToLscolors('di=38;2;255;0;0;48;2;0;205;0;7');
		const map = parseLscolors(result);
		// After swap: fg=green approx (c), bg=bright red approx (B)
		expect(map.get('di')?.fg).toBe('c');
		expect(map.get('di')?.bg).toBe('B');
	});
});

// -------------------------
// Round-trip identity
// -------------------------

describe('round-trip', () => {
	it('LSCOLORS -> LS_COLORS -> LSCOLORS preserves basic colors', () => {
		const original = 'exfxcxdxbxegedabagacad';
		const lsColors = lscolorsToLsColors(original, {
			includeExtraDefaults: false,
		});
		const roundTripped = lsColorsToLscolors(lsColors);
		expect(roundTripped).toBe(original);
	});

	it('round-trips all-default', () => {
		const original = 'xxxxxxxxxxxxxxxxxxxxxx';
		const lsColors = lscolorsToLsColors(original, {
			includeExtraDefaults: false,
		});
		const roundTripped = lsColorsToLscolors(lsColors);
		expect(roundTripped).toBe(original);
	});

	it('round-trips bright colors', () => {
		const original = 'ExFxCxDxBxEGEDABAGACAD';
		const lsColors = lscolorsToLsColors(original, {
			includeExtraDefaults: false,
		});
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

// -------------------------
// bsdCharToCssColor
// -------------------------

describe('bsdCharToCssColor', () => {
	it('maps lowercase a-h to system color hex', () => {
		expect(bsdCharToCssColor('a')).toBe('#000000'); // black
		expect(bsdCharToCssColor('b')).toBe('#cd0000'); // red
		expect(bsdCharToCssColor('c')).toBe('#00cd00'); // green
		expect(bsdCharToCssColor('d')).toBe('#cdcd00'); // brown/yellow
		expect(bsdCharToCssColor('e')).toBe('#0000ee'); // blue
		expect(bsdCharToCssColor('f')).toBe('#cd00cd'); // magenta
		expect(bsdCharToCssColor('g')).toBe('#00cdcd'); // cyan
		expect(bsdCharToCssColor('h')).toBe('#e5e5e5'); // light grey
	});

	it('maps uppercase A-H to bright system color hex', () => {
		expect(bsdCharToCssColor('A')).toBe('#7f7f7f'); // bright black (grey)
		expect(bsdCharToCssColor('B')).toBe('#ff0000'); // bright red
		expect(bsdCharToCssColor('C')).toBe('#00ff00'); // bright green
		expect(bsdCharToCssColor('D')).toBe('#ffff00'); // bright yellow
		expect(bsdCharToCssColor('E')).toBe('#5c5cff'); // bright blue
		expect(bsdCharToCssColor('F')).toBe('#ff00ff'); // bright magenta
		expect(bsdCharToCssColor('G')).toBe('#00ffff'); // bright cyan
		expect(bsdCharToCssColor('H')).toBe('#ffffff'); // bright white
	});

	it('returns null for x (default)', () => {
		expect(bsdCharToCssColor('x')).toBeNull();
	});

	it('returns null for unknown chars', () => {
		expect(bsdCharToCssColor('z')).toBeNull();
		expect(bsdCharToCssColor('0')).toBeNull();
	});
});

// -------------------------
// xterm256ToCssHex
// -------------------------

describe('xterm256ToCssHex', () => {
	it('converts system colors', () => {
		expect(xterm256ToCssHex(0)).toBe('#000000');
		expect(xterm256ToCssHex(1)).toBe('#cd0000');
		expect(xterm256ToCssHex(15)).toBe('#ffffff');
	});

	it('converts color cube indices', () => {
		expect(xterm256ToCssHex(16)).toBe('#000000'); // 0,0,0
		expect(xterm256ToCssHex(196)).toBe('#ff0000'); // 5,0,0
		expect(xterm256ToCssHex(21)).toBe('#0000ff'); // 0,0,5
	});

	it('converts grayscale ramp', () => {
		expect(xterm256ToCssHex(232)).toBe('#080808');
		expect(xterm256ToCssHex(255)).toBe('#eeeeee');
	});

	it('converts out-of-range to fallback grey', () => {
		expect(xterm256ToCssHex(256)).toBe('#808080');
		expect(xterm256ToCssHex(-1)).toBe('#808080');
	});
});

// -------------------------
// lscolorsToCssMap
// -------------------------

describe('lscolorsToCssMap', () => {
	it('maps all 11 slots from valid LSCOLORS', () => {
		const cssMap = lscolorsToCssMap('exfxcxdxbxegedabagacad');
		expect(cssMap.size).toBe(11);

		// di = e(blue fg), x(default bg)
		expect(cssMap.get('di')).toEqual({ fg: '#0000ee', bg: null });
		// ln = f(magenta fg), x(default bg)
		expect(cssMap.get('ln')).toEqual({ fg: '#cd00cd', bg: null });
		// bd = e(blue fg), g(cyan bg)
		expect(cssMap.get('bd')).toEqual({ fg: '#0000ee', bg: '#00cdcd' });
		// su = a(black fg), b(red bg)
		expect(cssMap.get('su')).toEqual({ fg: '#000000', bg: '#cd0000' });
	});

	it('maps all-default to all nulls', () => {
		const cssMap = lscolorsToCssMap('xxxxxxxxxxxxxxxxxxxxxx');
		for (const [, colors] of cssMap) {
			expect(colors.fg).toBeNull();
			expect(colors.bg).toBeNull();
		}
	});

	it('maps bright chars to bright colors', () => {
		const cssMap = lscolorsToCssMap('ExFxCxDxBxEGEDABAGACAD');
		// di = E(bright blue), x(default)
		expect(cssMap.get('di')).toEqual({ fg: '#5c5cff', bg: null });
		// bd = E(bright blue), G(bright cyan)
		expect(cssMap.get('bd')).toEqual({ fg: '#5c5cff', bg: '#00ffff' });
	});

	it('throws on invalid LSCOLORS length', () => {
		expect(() => lscolorsToCssMap('abc')).toThrow(
			'LSCOLORS must be exactly 22 chars',
		);
	});
});
