<script lang="ts">
import type { HTMLAttributes } from 'svelte/elements';
import CopyButton from './CopyButton.svelte';

interface Props extends HTMLAttributes<HTMLDivElement> {
	url: string;
	class?: string;
}

let { url, class: className = '', ...rest }: Props = $props();
</script>

<div class="share-row {className}" {...rest}>
	<CopyButton
		text={url}
		label="Share link"
		class="share-btn"
		aria-label="Copy permalink to clipboard"
	/>
</div>

<style>
.share-row {
	display: flex;
	justify-content: center;
	margin-top: 0.5rem;
}

/* Target the child CopyButton's rendered element via :global */
.share-row :global(.share-btn) {
	padding: 0.375rem 1.25rem;
}

.share-row :global(.share-btn.copied) {
	color: #66bb6a;
	border-color: #66bb6a;
}
</style>
