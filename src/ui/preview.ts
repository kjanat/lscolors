/**
 * Color preview table rendering.
 *
 * Shows 11 BSD slots with sample filenames colored by their fg/bg settings,
 * plus the raw BSD char pair, GNU SGR codes, and hex colors.
 */

import { bsdCharToAnsiBg, bsdCharToAnsiFg, parseLscolors } from '../bsd.ts';
import { lscolorsToCssMap } from '../convert.ts';
import { BSD_SLOT_LABELS, BSD_SLOTS, type BsdSlot } from '../types.ts';

/** Sample filenames shown in the preview for each slot */
const SLOT_SAMPLE_TEXT: Readonly<Record<BsdSlot, string>> = {
	di: 'Documents/',
	ln: 'link -> target',
	so: 'app.sock',
	pi: 'fifo.pipe',
	ex: 'run.sh',
	bd: 'sda1',
	cd: 'tty0',
	su: 'passwd',
	sg: 'crontab',
	tw: 'tmp/',
	ow: 'shared/',
};

/** Default foreground when BSD char is 'x' (terminal default fg) */
const DEFAULT_FG = '#e0e0e0';
/** Default background when BSD char is 'x' (transparent / terminal bg) */
const DEFAULT_BG = 'transparent';

/** Build SGR string from a BSD fg/bg char pair */
function bsdCharsToSgr(fg: string, bg: string): string {
	const parts: number[] = [];
	const fgCode = bsdCharToAnsiFg(fg);
	const bgCode = bsdCharToAnsiBg(bg);
	if (fgCode !== null) parts.push(fgCode);
	if (bgCode !== null) parts.push(bgCode);
	return parts.map(String).join(';');
}

/** Format fg/bg hex colors as a compact string */
function formatHex(fg: string | null, bg: string | null): string {
	const fgStr = fg ?? '—';
	const bgStr = bg ?? '—';
	if (bgStr === '—') return fgStr;
	return `${fgStr} / ${bgStr}`;
}

/**
 * Build or update the color preview grid.
 * Reads the current LSCOLORS value and renders 11 colored swatches.
 */
export function renderPreview(
	container: HTMLDivElement,
	lscolorsValue: string,
): void {
	container.innerHTML = '';

	if (lscolorsValue === '' || lscolorsValue.length !== 22) {
		return;
	}

	let cssMap: Map<
		BsdSlot,
		{ readonly fg: string | null; readonly bg: string | null }
	>;
	let bsdMap: Map<BsdSlot, { readonly fg: string; readonly bg: string }>;
	try {
		cssMap = lscolorsToCssMap(lscolorsValue);
		bsdMap = parseLscolors(lscolorsValue);
	} catch {
		return;
	}

	const table = document.createElement('table');
	table.className = 'preview-table';
	table.setAttribute('role', 'presentation');

	const thead = document.createElement('thead');
	const headerRow = document.createElement('tr');
	const headers: Array<{ text: string; title?: string }> = [
		{ text: 'Slot' },
		{ text: 'Label' },
		{ text: 'Preview' },
		{ text: 'BSD' },
		{
			text: 'SGR',
			title:
				'Select Graphic Rendition — ANSI escape codes for text formatting, colors, and styles in terminal emulators',
		},
		{ text: 'Hex' },
	];
	for (const { text, title } of headers) {
		const th = document.createElement('th');
		th.textContent = text;
		if (title !== undefined) th.title = title;
		headerRow.appendChild(th);
	}
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement('tbody');

	for (const slot of BSD_SLOTS) {
		const colors = cssMap.get(slot);
		const bsdColors = bsdMap.get(slot);
		const fg = colors?.fg ?? DEFAULT_FG;
		const bg = colors?.bg ?? DEFAULT_BG;
		const bsdFg = bsdColors?.fg ?? 'x';
		const bsdBg = bsdColors?.bg ?? 'x';

		const tr = document.createElement('tr');

		// Slot code cell
		const tdSlot = document.createElement('td');
		tdSlot.className = 'preview-slot';
		tdSlot.textContent = slot;
		tr.appendChild(tdSlot);

		// Label cell
		const tdLabel = document.createElement('td');
		tdLabel.className = 'preview-label';
		tdLabel.textContent = BSD_SLOT_LABELS[slot];
		tr.appendChild(tdLabel);

		// Sample text cell (colored)
		const tdSample = document.createElement('td');
		tdSample.className = 'preview-sample';
		const sampleSpan = document.createElement('span');
		sampleSpan.className = 'preview-swatch';
		sampleSpan.textContent = SLOT_SAMPLE_TEXT[slot];
		sampleSpan.style.color = fg;
		sampleSpan.style.backgroundColor = bg;
		tdSample.appendChild(sampleSpan);
		tr.appendChild(tdSample);

		// BSD char pair cell
		const tdBsd = document.createElement('td');
		tdBsd.className = 'preview-code';
		tdBsd.textContent = `${bsdFg}${bsdBg}`;
		tr.appendChild(tdBsd);

		// SGR codes cell
		const tdSgr = document.createElement('td');
		tdSgr.className = 'preview-code';
		tdSgr.textContent = bsdCharsToSgr(bsdFg, bsdBg) || '—';
		tr.appendChild(tdSgr);

		// Hex colors cell
		const tdHex = document.createElement('td');
		tdHex.className = 'preview-hex';
		tdHex.textContent = formatHex(colors?.fg ?? null, colors?.bg ?? null);
		tr.appendChild(tdHex);

		tbody.appendChild(tr);
	}

	table.appendChild(tbody);
	container.appendChild(table);
}
