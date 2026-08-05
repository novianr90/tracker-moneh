<script lang="ts">
	import { formatIDR } from '$lib/utils/formatters';
	import type { MonthlySummary } from '$lib/services/expenses';
	import { Wallet, Calendar, TrendingUp, TrendingDown } from 'lucide-svelte';

	export let summary: MonthlySummary = {
		total_amount: 0,
		transaction_count: 0,
		prev_month_total: 0
	};

	$: percentChange = summary.prev_month_total > 0
		? Math.round(((summary.total_amount - summary.prev_month_total) / summary.prev_month_total) * 100)
		: 0;
</script>

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
	<!-- Total Month Expense -->
	<div class="p-5 bg-card border border-border rounded-xl shadow-sm space-y-2">
		<div class="flex items-center justify-between text-muted-foreground">
			<span class="text-xs font-medium uppercase tracking-wider">This Month</span>
			<div class="p-2 bg-primary/10 rounded-lg text-primary">
				<Wallet class="w-5 h-5" />
			</div>
		</div>
		<div class="text-2xl font-black text-foreground">
			{formatIDR(summary.total_amount)}
		</div>
		<div class="flex items-center gap-1.5 text-xs">
			{#if percentChange > 0}
				<span class="text-rose-400 font-semibold flex items-center gap-0.5">
					<TrendingUp class="w-3.5 h-3.5" /> +{percentChange}%
				</span>
			{:else if percentChange < 0}
				<span class="text-emerald-400 font-semibold flex items-center gap-0.5">
					<TrendingDown class="w-3.5 h-3.5" /> {percentChange}%
				</span>
			{:else}
				<span class="text-muted-foreground">0% change</span>
			{/if}
			<span class="text-muted-foreground">vs last month</span>
		</div>
	</div>

	<!-- Total Transactions -->
	<div class="p-5 bg-card border border-border rounded-xl shadow-sm space-y-2">
		<div class="flex items-center justify-between text-muted-foreground">
			<span class="text-xs font-medium uppercase tracking-wider">Transactions</span>
			<div class="p-2 bg-secondary rounded-lg text-foreground">
				<Calendar class="w-5 h-5" />
			</div>
		</div>
		<div class="text-2xl font-black text-foreground">
			{summary.transaction_count}
		</div>
		<p class="text-xs text-muted-foreground">Recorded expenses this month</p>
	</div>

	<!-- Previous Month Comparison -->
	<div class="p-5 bg-card border border-border rounded-xl shadow-sm space-y-2">
		<div class="flex items-center justify-between text-muted-foreground">
			<span class="text-xs font-medium uppercase tracking-wider">Last Month Total</span>
			<div class="p-2 bg-accent rounded-lg text-accent-foreground">
				<TrendingUp class="w-5 h-5" />
			</div>
		</div>
		<div class="text-2xl font-black text-foreground">
			{formatIDR(summary.prev_month_total)}
		</div>
		<p class="text-xs text-muted-foreground">Benchmark monthly total</p>
	</div>
</div>
