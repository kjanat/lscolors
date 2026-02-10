<script lang="ts">
import {
	BSD_SLOTS,
	BSD_SLOT_LABELS,
	type BsdSlot,
	type BsdSlotColors,
	type SlotCssColors,
} from './types.ts';
import {
	lscolorsToLsColors,
	lsColorsToLscolors,
	lscolorsToCssMap,
} from './convert.ts';
import { parseLscolors, bsdCharToAnsiFg, bsdCharToAnsiBg } from './bsd.ts';
import { type Direction, encodeHash, decodeHash } from './ui/hash.ts';
import './style.css';

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
const DEFAULT_FG = '#e0e0e0';
const DEFAULT_BG = 'transparent';

function bsdCharsToSgr(fg: string, bg: string): string {
	const parts: number[] = [];
	const fgCode = bsdCharToAnsiFg(fg);
	const bgCode = bsdCharToAnsiBg(bg);
	if (fgCode !== null) parts.push(fgCode);
	if (bgCode !== null) parts.push(bgCode);
	return parts.map(String).join(';');
}

function formatHex(fg: string | null, bg: string | null): string {
	const fgStr = fg ?? '—';
	const bgStr = bg ?? '—';
	if (bgStr === '—') return fgStr;
	return `${fgStr} / ${bgStr}`;
}

// --- State ---

let direction: Direction = $state('lscolors-to-ls_colors');
let lscolorsValue: string = $state('');
let lsColorsValue: string = $state('');
let lscolorsError: string = $state('');
let lsColorsError: string = $state('');

// --- Initialization from URL hash ---

const initialHash = decodeHash(window.location.hash);
if (initialHash !== null) {
	direction = initialHash.source;
	if (initialHash.source === 'lscolors-to-ls_colors') {
		lscolorsValue = initialHash.value;
		try {
			lsColorsValue = lscolorsToLsColors(initialHash.value);
			lscolorsError = '';
		} catch (e: unknown) {
			lscolorsError = e instanceof Error ? e.message : 'Invalid LSCOLORS';
		}
	} else {
		lsColorsValue = initialHash.value;
		try {
			lscolorsValue = lsColorsToLscolors(initialHash.value);
			lsColorsError = '';
		} catch (e: unknown) {
			lsColorsError = e instanceof Error ? e.message : 'Invalid LS_COLORS';
		}
	}
}

// --- Derived values ---

let directionLabel: string = $derived(
	direction === 'lscolors-to-ls_colors'
		? 'LSCOLORS → LS_COLORS'
		: 'LS_COLORS → LSCOLORS',
);

let swapIcon: string = $derived(
	direction === 'lscolors-to-ls_colors' ? '↓' : '↑',
);

let previewCssMap: Map<BsdSlot, SlotCssColors> | null = $derived.by(() => {
	if (lscolorsValue.length !== 22) return null;
	try {
		return lscolorsToCssMap(lscolorsValue);
	} catch {
		return null;
	}
});

let previewBsdMap: Map<BsdSlot, BsdSlotColors> | null = $derived.by(() => {
	if (lscolorsValue.length !== 22) return null;
	try {
		return parseLscolors(lscolorsValue);
	} catch {
		return null;
	}
});

// --- Conversion handlers ---

function handleLscolorsInput(): void {
	lscolorsError = '';
	lsColorsError = '';
	direction = 'lscolors-to-ls_colors';
	try {
		lsColorsValue = lscolorsToLsColors(lscolorsValue);
	} catch (e: unknown) {
		lscolorsError = e instanceof Error ? e.message : 'Invalid LSCOLORS';
	}
}

function handleLsColorsInput(): void {
	lsColorsError = '';
	lscolorsError = '';
	direction = 'ls_colors-to-lscolors';
	try {
		lscolorsValue = lsColorsToLscolors(lsColorsValue);
	} catch (e: unknown) {
		lsColorsError = e instanceof Error ? e.message : 'Invalid LS_COLORS';
	}
}

// --- Direction swap ---

function handleSwap(): void {
	lscolorsError = '';
	lsColorsError = '';
	if (direction === 'lscolors-to-ls_colors') {
		direction = 'ls_colors-to-lscolors';
		try {
			lscolorsValue = lsColorsToLscolors(lsColorsValue);
		} catch (e: unknown) {
			lsColorsError = e instanceof Error ? e.message : 'Invalid LS_COLORS';
		}
	} else {
		direction = 'lscolors-to-ls_colors';
		try {
			lsColorsValue = lscolorsToLsColors(lscolorsValue);
		} catch (e: unknown) {
			lscolorsError = e instanceof Error ? e.message : 'Invalid LSCOLORS';
		}
	}
}

// --- Clipboard copy ---

function copyToClipboard(event: MouseEvent, text: string): void {
	const target = event.currentTarget;
	if (!(target instanceof HTMLButtonElement)) return;
	const original = target.textContent;
	void navigator.clipboard.writeText(text).then(() => {
		target.textContent = 'Copied!';
		target.setAttribute('data-copied', 'true');
		setTimeout(() => {
			target.textContent = original;
			target.removeAttribute('data-copied');
		}, 1200);
	});
}

// --- URL hash sync ---

$effect(() => {
	const sourceValue =
		direction === 'lscolors-to-ls_colors' ? lscolorsValue : lsColorsValue;
	const hash = encodeHash({ source: direction, value: sourceValue });
	if (hash === '') {
		history.replaceState(
			null,
			'',
			window.location.pathname + window.location.search,
		);
	} else {
		history.replaceState(null, '', hash);
	}
});
</script>

<main>
	<header>
		<h1>LSCOLORS <span class="arrow">↔</span> LS_COLORS</h1>
		<p class="subtitle">Convert between macOS/BSD and GNU dircolors formats</p>
		<a
			class="repo-link"
			href="https://github.com/kjanat/lscolors#readme"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="View on GitHub"
		>
			<svg
				viewBox="0 0 16 16"
				width="20"
				height="20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
			</svg>
		</a>
	</header>

	<div class="converter">
		<!-- LSCOLORS input field -->
		<div class="field field--lscolors">
			<label for="lscolors-input">LSCOLORS <span class="label-hint"
				>(BSD/macOS, 22 chars)</span></label>
			<div class="input-row">
				<input
					id="lscolors-input"
					type="text"
					maxlength={22}
					spellcheck="false"
					autocomplete="off"
					placeholder="exfxcxdxbxegedabagacad"
					bind:value={lscolorsValue}
					oninput={handleLscolorsInput}
				>
				<button
					type="button"
					class="copy-btn"
					aria-label="Copy LSCOLORS value"
					onclick={(e) => copyToClipboard(e, lscolorsValue)}
				>
					Copy
				</button>
			</div>
			<div
				class="error"
				role="alert"
				aria-live="polite"
				hidden={lscolorsError === ''}
			>
				{lscolorsError}
			</div>
		</div>

		<!-- Swap direction -->
		<div class="swap-container">
			<button
				type="button"
				class="swap-btn"
				aria-label="Swap conversion direction"
				onclick={handleSwap}
			>
				<span class="swap-icon" aria-hidden="true">{swapIcon}</span>
			</button>
			<span class="direction">{directionLabel}</span>
		</div>

		<!-- LS_COLORS textarea -->
		<div class="field field--ls-colors">
			<label for="ls-colors-input">LS_COLORS <span class="label-hint"
				>(GNU/Linux dircolors)</span></label>
			<div class="input-row">
				<textarea
					id="ls-colors-input"
					rows={4}
					spellcheck="false"
					autocomplete="off"
					placeholder="di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=34;43"
					bind:value={lsColorsValue}
					oninput={handleLsColorsInput}
				></textarea>
				<button
					type="button"
					class="copy-btn"
					aria-label="Copy LS_COLORS value"
					onclick={(e) => copyToClipboard(e, lsColorsValue)}
				>
					Copy
				</button>
			</div>
			<div
				class="error"
				role="alert"
				aria-live="polite"
				hidden={lsColorsError === ''}
			>
				{lsColorsError}
			</div>
		</div>
	</div>

	<!-- Share permalink -->
	<div class="share-row">
		<button
			type="button"
			class="share-btn"
			aria-label="Copy permalink to clipboard"
			onclick={(e) => copyToClipboard(e, window.location.href)}
		>
			Share link
		</button>
	</div>

	<!-- Preview table: 11 BSD slots -->
	{#if lscolorsValue.length === 22 && previewCssMap !== null && previewBsdMap !== null}
		<div class="preview">
			<table class="preview-table" role="presentation">
				<thead>
					<tr>
						<th>Slot</th>
						<th>Label</th>
						<th>Preview</th>
						<th>BSD</th>
						<th title="Select Graphic Rendition — ANSI escape codes for text formatting, colors, and styles in terminal emulators">
							SGR
						</th>
						<th>Hex</th>
					</tr>
				</thead>
				<tbody>
					{#each BSD_SLOTS as slot (slot)}
						{@const colors = previewCssMap.get(slot)}
						{@const bsdColors = previewBsdMap.get(slot)}
						{@const fg = colors?.fg ?? DEFAULT_FG}
						{@const bg = colors?.bg ?? DEFAULT_BG}
						{@const bsdFg = bsdColors?.fg ?? 'x'}
						{@const bsdBg = bsdColors?.bg ?? 'x'}
						<tr>
							<td class="preview-slot">{slot}</td>
							<td class="preview-label">{BSD_SLOT_LABELS[slot]}</td>
							<td class="preview-sample">
								<span
									class="preview-swatch"
									style:color={fg}
									style:background-color={bg}
								>{SLOT_SAMPLE_TEXT[slot]}</span>
							</td>
							<td class="preview-code">{bsdFg}{bsdBg}</td>
							<td class="preview-code">{bsdCharsToSgr(bsdFg, bsdBg) || '—'}</td>
							<td class="preview-hex">
								{formatHex(colors?.fg ?? null, colors?.bg ?? null)}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>
