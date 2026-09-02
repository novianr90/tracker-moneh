<script lang="ts">
	import { onMount } from 'svelte';
	import ExpenseForm from '$lib/components/forms/ExpenseForm.svelte';
	import SummaryCards from '$lib/components/dashboard/SummaryCards.svelte';
	import ExpenseTrendChart from '$lib/components/dashboard/ExpenseTrendChart.svelte';
	import CategoryChart from '$lib/components/dashboard/CategoryChart.svelte';
	import RecentTransactions from '$lib/components/dashboard/RecentTransactions.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { LayoutDashboard, Loader2 } from 'lucide-svelte';
	import { expenseService, type MonthlySummary, type CategoryBreakdown, type RecentExpenseView } from '$lib/services/expenses';

	let summary: MonthlySummary = { total_amount: 0, transaction_count: 0, prev_month_total: 0 };
	let categories: CategoryBreakdown[] = [];
	let recentTransactions: RecentExpenseView[] = [];
	let loading = true;

	async function loadDashboardData() {
		loading = true;
		try {
			const [sumData, catData, recentData] = await Promise.all([
				expenseService.getMonthlySummary(),
				expenseService.getMonthlyCategoryBreakdown(),
				expenseService.getRecentTransactions(8)
			]);

			summary = sumData;
			categories = catData;
			recentTransactions = recentData;
		} catch (err: any) {
			console.error('Failed loading dashboard:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadDashboardData();
	});
</script>

<div class="space-y-6">
	<!-- Page Banner / Header -->
	<PageHeader icon={LayoutDashboard} title="Dashboard" description="Track expenses rapidly and review monthly summaries">
		<svelte:fragment slot="actions">
			{#if loading}
				<span class="flex items-center gap-1.5 text-xs text-muted-foreground">
					<Loader2 class="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Refreshing...
				</span>
			{/if}
		</svelte:fragment>
	</PageHeader>

	<!-- Rapid Expense Entry Form Component -->
	<ExpenseForm onSuccess={loadDashboardData} />

	<!-- Metrics Summary Cards -->
	<SummaryCards {summary} />

	<!-- Interactive Daily Expense Trend Analytics -->
	<ExpenseTrendChart />

	<!-- Grid Section: Breakdown & Feed -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<CategoryChart {categories} />
		<RecentTransactions transactions={recentTransactions} />
	</div>
</div>
