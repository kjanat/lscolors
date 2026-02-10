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
