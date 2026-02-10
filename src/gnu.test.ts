import { describe, expect, it } from 'vitest';
import { parseLsColors, stringifyLsColors } from './gnu.ts';

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
