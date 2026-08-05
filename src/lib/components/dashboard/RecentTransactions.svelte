<script lang="ts">
	import { formatIDR, formatDate } from '$lib/utils/formatters';
	import type { RecentExpenseView } from '$lib/services/expenses';
	import { ListFilter, ArrowRight } from 'lucide-svelte';

	export let transactions: RecentExpenseView[] = [];
</script>

<div class="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-md font-bold text-foreground flex items-center gap-2">
			<ListFilter class="w-5 h-5 text-primary" />
			Recent Transactions
		</h3>
		<a href="/expenses" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
			View All <ArrowRight class="w-3.5 h-3.5" />
		</a>
	</div>

	{#if transactions.length === 0}
		<div class="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
			No recent transactions. Add your first expense above!
		</div>
	{:else}
		<div class="divide-y divide-border">
			{#each transactions as item}
				<div class="py-3 flex items-center justify-between first:pt-0 last:pb-0">
					<div class="flex items-center gap-3">
						<div
							class="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
							style="background-color: {item.category_color || '#6b7280'};"
						>
							{item.category_name?.charAt(0) || 'E'}
						</div>
						<div>
							<div class="text-sm font-semibold text-foreground">
								{item.category_name}
							</div>
							<div class="text-xs text-muted-foreground">
								{item.description || 'No description'} • {formatDate(item.expense_date)}
							</div>
						</div>
					</div>
					<div class="text-sm font-bold text-foreground">
						{formatIDR(item.amount)}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
