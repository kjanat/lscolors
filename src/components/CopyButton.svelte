<script lang="ts">
import { onDestroy } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

interface Props extends HTMLButtonAttributes {
	text: string;
	label?: string;
	class?: string;
}

let { text, label = 'Copy', class: className = '', ...rest }: Props = $props();

let copied = $state(false);
let timeoutId: ReturnType<typeof setTimeout> | undefined = $state(undefined);
let clickGeneration = 0;

async function handleClick(): Promise<void> {
	if (timeoutId !== undefined) {
		clearTimeout(timeoutId);
		timeoutId = undefined;
	}
	const gen = ++clickGeneration;
	try {
		await navigator.clipboard.writeText(text);
		if (gen !== clickGeneration) return;
		copied = true;
		timeoutId = setTimeout(() => {
			copied = false;
			timeoutId = undefined;
		}, 1200);
	} catch {
		if (gen !== clickGeneration) return;
		copied = false;
	}
}

onDestroy(() => {
	if (timeoutId !== undefined) {
		clearTimeout(timeoutId);
		timeoutId = undefined;
	}
});
</script>

<button
	type="button"
	class="copy-btn {className}"
	class:copied
	onclick={handleClick}
	{...rest}
>
	<span class="copy-btn-label" aria-live="polite" aria-atomic="true">{
		copied ? 'Copied!' : label
	}</span>
</button>

<style>
.copy-btn {
	flex-shrink: 0;
	padding: 0.5rem 0.75rem;
	font-family: var(--font-mono);
	font-size: 0.75rem;
	color: var(--fg-muted);
	white-space: nowrap;
	cursor: pointer;
	background: var(--bg-surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}

.copy-btn:hover {
	color: var(--fg);
	background: var(--bg-input);
	border-color: var(--accent-hover);
}

.copy-btn:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

.copy-btn.copied {
	color: var(--success);
	border-color: var(--success);
}

@media (max-width: 480px) {
	.copy-btn {
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0.5rem 1rem;
		font-size: 0.8rem;
	}
}
</style>
