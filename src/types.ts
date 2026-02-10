/** Two-letter BSD file type key */
export type BsdSlot = 'di' | 'ln' | 'so' | 'pi' | 'ex' | 'bd' | 'cd' | 'su' | 'sg' | 'tw' | 'ow';

/** Ordered list of all 11 BSD slots */
export const BSD_SLOTS: readonly BsdSlot[] = [
	'di',
	'ln',
	'so',
	'pi',
	'ex',
	'bd',
	'cd',
	'su',
	'sg',
	'tw',
	'ow',
] as const;

/** Human-readable labels for each BSD slot */
export const BSD_SLOT_LABELS: Readonly<Record<BsdSlot, string>> = {
	di: 'Directory',
	ln: 'Symbolic link',
	so: 'Socket',
	pi: 'Pipe (FIFO)',
	ex: 'Executable',
	bd: 'Block device',
	cd: 'Character device',
	su: 'Setuid (u+s)',
	sg: 'Setgid (g+s)',
	tw: 'Sticky + other-writable',
	ow: 'Other-writable',
};

/** Foreground + background pair for a single BSD slot */
export interface BsdSlotColors {
	readonly fg: string;
	readonly bg: string;
}

/** RGB triplet [r, g, b] with values 0–255 */
export type Rgb = readonly [number, number, number];

/** Parsed ANSI SGR style: basic codes + optional extended color info */
export interface Style {
	/** SGR attribute codes (e.g. [1, 34] for bold blue) */
	codes: readonly number[];
	/** 256-color foreground index (38;5;N), if present */
	fg256?: number;
	/** 256-color background index (48;5;N), if present */
	bg256?: number;
	/** Truecolor foreground (38;2;r;g;b), if present */
	fgRgb?: Rgb;
	/** Truecolor background (48;2;r;g;b), if present */
	bgRgb?: Rgb;
}

/** CSS hex representation of a color, or null for default/terminal-dependent */
export type CssColor = string | null;

/** Resolved fg/bg CSS colors for a single BSD slot */
export interface SlotCssColors {
	readonly fg: CssColor;
	readonly bg: CssColor;
}
