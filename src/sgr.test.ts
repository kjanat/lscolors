import { describe, expect, it } from 'vitest';
import { parseSgr, stringifySgr } from './sgr.ts';

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

	it('parses truecolor foreground (38;2;r;g;b)', () => {
		const st = parseSgr('38;2;255;128;0');
		expect(st.codes).toEqual([]);
		expect(st.fgRgb).toEqual([255, 128, 0]);
	});

	it('parses truecolor background (48;2;r;g;b)', () => {
		const st = parseSgr('48;2;0;64;128');
		expect(st.codes).toEqual([]);
		expect(st.bgRgb).toEqual([0, 64, 128]);
	});

	it('parses mixed: bold + truecolor fg + truecolor bg', () => {
		const st = parseSgr('01;38;2;255;0;0;48;2;0;0;255');
		expect(st.codes).toEqual([1]);
		expect(st.fgRgb).toEqual([255, 0, 0]);
		expect(st.bgRgb).toEqual([0, 0, 255]);
	});

	it('parses truecolor alongside 256-color', () => {
		const st = parseSgr('38;2;255;0;0;48;5;235');
		expect(st.fgRgb).toEqual([255, 0, 0]);
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
		expect(stringifySgr({ codes: [1], fg256: 200, bg256: 235 })).toBe(
			'1;38;5;200;48;5;235',
		);
	});

	it('round-trips through parseSgr', () => {
		const original = '01;38;5;200;48;5;235';
		const parsed = parseSgr(original);
		expect(stringifySgr(parsed)).toBe('1;38;5;200;48;5;235');
	});

	it('appends truecolor sequences', () => {
		expect(
			stringifySgr({ codes: [1], fgRgb: [255, 0, 0], bgRgb: [0, 0, 255] }),
		).toBe('1;38;2;255;0;0;48;2;0;0;255');
	});

	it('round-trips truecolor through parseSgr', () => {
		const original = '01;38;2;128;64;32;48;2;0;255;128';
		const parsed = parseSgr(original);
		expect(stringifySgr(parsed)).toBe('1;38;2;128;64;32;48;2;0;255;128');
	});
});
