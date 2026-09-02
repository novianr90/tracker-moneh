<script lang="ts">
	import type { ComponentType } from 'svelte';

	export let icon: ComponentType | undefined = undefined;
	export let title: string;
	export let description: string | undefined = undefined;
</script>

<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
	<div>
		<h1 class="text-2xl font-heading font-semibold text-foreground flex items-center gap-2.5">
			{#if icon}
				<svelte:component this={icon} class="w-5 h-5 text-primary" aria-hidden="true" />
			{/if}
			{title}
		</h1>
		{#if description}
			<p class="text-xs text-muted-foreground mt-0.5">{description}</p>
		{/if}
	</div>

	{#if $$slots.actions}
		<div class="flex items-center gap-2 self-start sm:self-auto">
			<slot name="actions" />
		</div>
	{/if}
</div>
