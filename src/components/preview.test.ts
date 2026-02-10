import { describe, expect, it } from 'vitest';
import { bsdCharsToSgr, formatHex } from './preview.ts';

describe('bsdCharsToSgr', () => {
	it('returns empty string for default fg and bg', () => {
		expect(bsdCharsToSgr('x', 'x')).toBe('');
	});

	it('returns fg code only when bg is default', () => {
		expect(bsdCharsToSgr('b', 'x')).toBe('31');
	});

	it('returns bg code only when fg is default', () => {
		expect(bsdCharsToSgr('x', 'c')).toBe('42');
	});

	it('returns both codes separated by semicolon', () => {
		expect(bsdCharsToSgr('e', 'b')).toBe('34;41');
	});

	it('handles bright (uppercase) fg char', () => {
		expect(bsdCharsToSgr('B', 'x')).toBe('91');
	});
});

describe('formatHex', () => {
	it('returns fg only when bg is null', () => {
		expect(formatHex('#ff0000', null)).toBe('#ff0000');
	});

	it('returns dash when both are null', () => {
		expect(formatHex(null, null)).toBe('\u2014');
	});

	it('returns fg / bg when both present', () => {
		expect(formatHex('#ff0000', '#0000ff')).toBe('#ff0000 / #0000ff');
	});

	it('returns dash / bg when fg is null but bg present', () => {
		expect(formatHex(null, '#00ff00')).toBe('\u2014 / #00ff00');
	});
});
