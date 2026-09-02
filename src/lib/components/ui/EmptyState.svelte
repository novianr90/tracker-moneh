<script lang="ts">
	import type { ComponentType } from 'svelte';

	export let icon: ComponentType | undefined = undefined;
	export let message: string;
	export let hint: string | undefined = undefined;
</script>

<div class="text-center py-8 px-4 border border-dashed border-border rounded-lg">
	{#if icon}
		<svelte:component this={icon} class="w-8 h-8 text-muted-foreground mx-auto mb-2" aria-hidden="true" />
	{/if}
	<p class="text-xs font-medium text-foreground">{message}</p>
	{#if hint}
		<p class="text-xs text-muted-foreground mt-1">{hint}</p>
	{/if}
</div>
