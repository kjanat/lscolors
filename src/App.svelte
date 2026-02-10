<script lang="ts">
import { onMount } from 'svelte';
import {
	type BsdSlot,
	type BsdSlotColors,
	type SlotCssColors,
} from './types.ts';
import {
	lscolorsToLsColors,
	lsColorsToLscolors,
	lscolorsToCssMap,
} from './convert.ts';
import { parseLscolors } from './bsd.ts';
import { type Direction, encodeHash, decodeHash } from './ui/hash.ts';
import ColorInput from './components/ColorInput.svelte';
import PreviewTable from './components/PreviewTable.svelte';
import ShareButton from './components/ShareButton.svelte';
import SwapControl from './components/SwapControl.svelte';
import './style.css';

// --- State ---

let direction: Direction = $state('lscolors-to-ls_colors');
let lscolorsValue: string = $state('');
let lsColorsValue: string = $state('');
let lscolorsError: string = $state('');
let lsColorsError: string = $state('');

// --- Initialization from URL hash ---
// Must remain client-only: decodeHash reads window.location.hash which
// doesn't exist during SSR. onMount guarantees a browser environment.

onMount(() => {
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
});

// --- Derived values ---

let directionLabel: string = $derived(
	direction === 'lscolors-to-ls_colors'
		? 'LSCOLORS → LS_COLORS'
		: 'LS_COLORS → LSCOLORS',
);

let swapIcon: string = $derived(
	direction === 'lscolors-to-ls_colors' ? '↓' : '↑',
);

let previewMaps: {
	readonly css: Map<BsdSlot, SlotCssColors> | null;
	readonly bsd: Map<BsdSlot, BsdSlotColors> | null;
} = $derived.by(() => {
	if (lscolorsValue.length !== 22) return { css: null, bsd: null };
	try {
		// parseLscolors is called once here; lscolorsToCssMap calls it again
		// internally, but both parse the same input — they succeed or fail together.
		return {
			css: lscolorsToCssMap(lscolorsValue),
			bsd: parseLscolors(lscolorsValue),
		};
	} catch {
		return { css: null, bsd: null };
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
		lsColorsValue = '';
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
		lscolorsValue = '';
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
			lscolorsValue = '';
			lsColorsError = e instanceof Error ? e.message : 'Invalid LS_COLORS';
		}
	} else {
		direction = 'lscolors-to-ls_colors';
		try {
			lsColorsValue = lscolorsToLsColors(lscolorsValue);
		} catch (e: unknown) {
			lsColorsValue = '';
			lscolorsError = e instanceof Error ? e.message : 'Invalid LSCOLORS';
		}
	}
}

// --- URL hash sync ---

let hashFragment: string = $derived.by(() => {
	const sourceValue =
		direction === 'lscolors-to-ls_colors' ? lscolorsValue : lsColorsValue;
	return encodeHash({ source: direction, value: sourceValue });
});

let permalinkUrl: string = $derived(
	hashFragment === ''
		? window.location.origin + window.location.pathname + window.location.search
		: window.location.origin +
				window.location.pathname +
				window.location.search +
				hashFragment,
);

let hashTimeout: ReturnType<typeof setTimeout> | undefined;
let lastAppliedUrl: string | undefined;

$effect(() => {
	const url = permalinkUrl;
	if (url === lastAppliedUrl) return;
	clearTimeout(hashTimeout);
	hashTimeout = setTimeout(() => {
		lastAppliedUrl = url;
		history.replaceState(null, '', url);
	}, 120);
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
		<ColorInput
			bind:value={lscolorsValue}
			error={lscolorsError}
			oninput={handleLscolorsInput}
			label="LSCOLORS"
			hint="BSD/macOS, 22 chars"
			id="lscolors"
			maxlength={22}
			placeholder="exfxcxdxbxegedabagacad"
			class="bsd-input"
		/>

		<!-- Swap direction -->
		<SwapControl icon={swapIcon} label={directionLabel} onswap={handleSwap} />

		<!-- LS_COLORS textarea -->
		<ColorInput
			bind:value={lsColorsValue}
			error={lsColorsError}
			oninput={handleLsColorsInput}
			label="LS_COLORS"
			hint="GNU/Linux, colon-delimited"
			id="ls-colors"
			multiline
			rows={2}
			placeholder="di=01;34:ln=01;36:so=01;35:pi=33:ex=01;32:bd=01;33:cd=01;33:su=37;41:sg=30;43:tw=30;42:ow=34;42"
		/>
	</div>

	<!-- Share permalink -->
	<ShareButton url={permalinkUrl} />

	<!-- Preview table: 11 BSD slots -->
	<PreviewTable cssMap={previewMaps.css} bsdMap={previewMaps.bsd} />
</main>

<style>
header {
	margin-bottom: 2rem;
	text-align: center;
}

h1 {
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--error);
	letter-spacing: -0.02em;
}

.arrow {
	color: var(--accent);
}

.subtitle {
	margin-top: 0.25rem;
	font-size: 0.8rem;
	color: var(--fg-muted);
}

.repo-link {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-top: 0.5rem;
	color: var(--fg-muted);
	transition: color 0.15s;
}

.repo-link:hover {
	color: var(--accent);
}

.converter {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

@media (max-width: 480px) {
	h1 {
		font-size: 1.2rem;
	}

	.subtitle {
		font-size: 0.7rem;
	}
}

/* BSD-specific: wider letter-spacing for dense 22-char string */
.converter :global(.bsd-input input) {
	font-size: 1rem;
	letter-spacing: 0.1em;
}

@media (max-width: 375px) {
	h1 {
		font-size: 1.05rem;
	}

	.converter {
		gap: 0.75rem;
	}

	.converter :global(.bsd-input input) {
		font-size: 0.85rem;
		letter-spacing: 0.05em;
	}
}
</style>
