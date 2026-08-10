<script lang="ts">
	import { onMount } from 'svelte';
	import ExpenseForm from '$lib/components/forms/ExpenseForm.svelte';
	import SummaryCards from '$lib/components/dashboard/SummaryCards.svelte';
	import ExpenseTrendChart from '$lib/components/dashboard/ExpenseTrendChart.svelte';
	import CategoryChart from '$lib/components/dashboard/CategoryChart.svelte';
	import RecentTransactions from '$lib/components/dashboard/RecentTransactions.svelte';
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
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
		<div>
			<h1 class="text-2xl font-black tracking-tight text-foreground">Dashboard</h1>
			<p class="text-xs text-muted-foreground">Track expenses rapidly and review monthly summaries</p>
		</div>
	</div>

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
