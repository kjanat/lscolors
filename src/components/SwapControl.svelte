<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';

interface Props extends HTMLAttributes<HTMLDivElement> {
	icon: string;
	label: string;
	onswap: () => void;
}

let { icon, label, onswap, class: className = '', ...rest }: Props = $props();
</script>

<div class="swap-container {className}" {...rest}>
	<button
		type="button"
		class="swap-btn"
		aria-label="Swap conversion direction"
		onclick={onswap}
	>
		<span class="swap-icon" aria-hidden="true">{icon}</span>
	</button>
	<span class="direction">{label}</span>
</div>

<style>
.swap-container {
	display: flex;
	gap: 0.75rem;
	align-items: center;
	padding: 0.25rem 0;
}

.swap-btn {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	width: 2.25rem;
	height: 2.25rem;
	font-size: 1.1rem;
	color: var(--accent);
	cursor: pointer;
	background: var(--bg-surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	transition: background-color 0.15s, border-color 0.15s;
}

.swap-btn:hover {
	background: var(--bg-input);
	border-color: var(--accent-hover);
}

.swap-btn:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

.swap-icon {
	line-height: 1;
}

.direction {
	font-size: 0.75rem;
	color: var(--fg-muted);
}

@media (max-width: 480px) {
	.swap-btn {
		width: 2.75rem;
		height: 2.75rem;
		font-size: 1.2rem;
	}
}
</style>
