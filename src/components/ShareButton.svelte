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
