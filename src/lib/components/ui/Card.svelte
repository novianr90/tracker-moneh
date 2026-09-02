<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	/** Base surface used across core-exp pages instead of repeating card Tailwind strings. */
	export let padding = true;
	let className = '';
	export { className as class };
</script>

<div class={twMerge('bg-card border border-border rounded-lg shadow-sm', padding ? 'p-5' : '', className)}>
	<slot />
</div>
