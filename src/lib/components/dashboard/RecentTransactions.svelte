<script lang="ts">
	import { formatIDR, formatDate } from '$lib/utils/formatters';
	import type { RecentExpenseView } from '$lib/services/expenses';
	import { ListFilter, ArrowRight } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	export let transactions: RecentExpenseView[] = [];
</script>

<Card class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-md font-heading font-bold text-foreground flex items-center gap-2">
			<ListFilter class="w-5 h-5 text-primary" aria-hidden="true" />
			Recent Transactions
		</h3>
		<a href="/expenses" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
			View All <ArrowRight class="w-3.5 h-3.5" aria-hidden="true" />
		</a>
	</div>

	{#if transactions.length === 0}
		<EmptyState icon={ListFilter} message="No recent transactions." hint="Add your first expense above!" />
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
							<div class="text-sm font-semibold text-foreground flex items-center gap-2">
								{item.category_name}
								<span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
									{item.payment_method || 'Cash'}
								</span>
							</div>
							<div class="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
								{#if item.payee}
									<span class="font-medium text-foreground">{item.payee}</span>
									{#if item.description}
										<span>•</span>
									{/if}
								{/if}
								{#if item.description}
									<span>{item.description}</span>
								{/if}
								{#if !item.payee && !item.description}
									<span>No details</span>
								{/if}
								<span>•</span>
								<span>{formatDate(item.expense_date)}</span>
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
</Card>
