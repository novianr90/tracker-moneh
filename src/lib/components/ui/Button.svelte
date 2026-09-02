<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	export let variant: 'primary' | 'secondary' | 'ghost' | 'destructive' = 'primary';
	export let size: 'sm' | 'md' | 'icon' = 'md';
	export let loading = false;
	export let disabled = false;
	export let type: 'button' | 'submit' | 'reset' = 'button';

	let className = '';
	export { className as class };

	const base =
		'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

	const variants = {
		primary: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md',
		secondary: 'bg-secondary hover:bg-secondary/80 text-foreground',
		ghost: 'text-muted-foreground hover:text-foreground hover:bg-secondary',
		destructive: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm'
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2.5 text-sm',
		icon: 'p-2'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	class="{base} {variants[variant]} {sizes[size]} {className}"
	on:click
	{...$$restProps}
>
	{#if loading}
		<Loader2 class="w-4 h-4 animate-spin" aria-hidden="true" />
	{:else}
		<slot name="icon" />
	{/if}
	<slot />
</button>
