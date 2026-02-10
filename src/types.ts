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

/** Parsed ANSI SGR style: basic codes + optional 256-color indices */
export interface Style {
	/** SGR attribute codes (e.g. [1, 34] for bold blue) */
	codes: readonly number[];
	/** 256-color foreground index, if present */
	fg256?: number;
	/** 256-color background index, if present */
	bg256?: number;
}

/** CSS hex representation of a color, or null for default/terminal-dependent */
export type CssColor = string | null;

/** Resolved fg/bg CSS colors for a single BSD slot */
export interface SlotCssColors {
	readonly fg: CssColor;
	readonly bg: CssColor;
}
