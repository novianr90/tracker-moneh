<script lang="ts">
	/** Status pill used for sync status, active/inactive tags, default/custom tags. */
	export let variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';
	export let title: string | undefined = undefined;

	const variants = {
		success: 'bg-success/10 text-success border-success/20',
		warning: 'bg-warning/10 text-warning border-warning/20',
		danger: 'bg-destructive/10 text-destructive border-destructive/20',
		info: 'bg-info/10 text-info border-info/20',
		neutral: 'bg-muted text-muted-foreground border-border'
	};
</script>

<span
	{title}
	class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border {variants[variant]}"
>
	<slot name="icon" />
	<slot />
</span>
