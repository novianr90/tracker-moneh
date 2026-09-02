<script lang="ts">
	import { formatIDR } from '$lib/utils/formatters';
	import type { CategoryBreakdown } from '$lib/services/expenses';
	import { PieChart } from 'lucide-svelte';

	export let categories: CategoryBreakdown[] = [];

	$: totalSum = categories.reduce((acc, cat) => acc + cat.total_amount, 0);
</script>

<div class="p-6 bg-card border border-border rounded-lg shadow-sm space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-md font-bold text-foreground flex items-center gap-2">
			<PieChart class="w-5 h-5 text-primary" />
			Expense by Category
		</h3>
		<span class="text-xs font-semibold text-muted-foreground">This Month</span>
	</div>

	{#if categories.length === 0}
		<div class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
			No expense data recorded for this month.
		</div>
	{:else}
		<div class="space-y-3">
			{#each categories as cat}
				{@const percentage = totalSum > 0 ? Math.round((cat.total_amount / totalSum) * 100) : 0}
				<div class="space-y-1">
					<div class="flex items-center justify-between text-xs">
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-full inline-block" style="background-color: {cat.color || '#6b7280'};"></span>
							<span class="font-medium text-foreground">{cat.category_name}</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="text-muted-foreground">{percentage}%</span>
							<span class="font-semibold text-foreground">{formatIDR(cat.total_amount)}</span>
						</div>
					</div>
					<!-- Progress Bar -->
					<div class="w-full h-2 bg-secondary rounded-full overflow-hidden">
						<div
							class="h-full rounded-full transition-all duration-500"
							style="width: {percentage}%; background-color: {cat.color || '#10b981'};"
						></div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
