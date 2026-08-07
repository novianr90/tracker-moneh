<script lang="ts">
	import { onMount } from 'svelte';
	import { expenseService, type RecentExpenseView } from '$lib/services/expenses';
	import { categoryService, type Category } from '$lib/services/categories';
	import { formatIDR, formatDate } from '$lib/utils/formatters';
	import { Receipt, Search, Filter, Trash2, Calendar, FileSpreadsheet } from 'lucide-svelte';

	let expenses: RecentExpenseView[] = [];
	let categories: Category[] = [];
	let loading = true;

	// Filter state
	let searchKey = '';
	let categoryId = '';
	let startDate = '';
	let endDate = '';

	async function loadData() {
		loading = true;
		try {
			const [expData, catData] = await Promise.all([
				expenseService.getExpenses({
					searchKey: searchKey || undefined,
					categoryId: categoryId || undefined,
					startDate: startDate || undefined,
					endDate: endDate || undefined
				}),
				categoryService.getCategories()
			]);
			expenses = expData;
			categories = catData;
		} catch (err: any) {
			console.error('Failed loading expenses:', err);
		} finally {
			loading = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this expense?')) return;
		try {
			await expenseService.deleteExpense(id);
			await loadData();
		} catch (err: any) {
			alert('Failed to delete expense: ' + err.message);
		}
	}

	function handleExportCSV() {
		if (expenses.length === 0) return;
		const headers = ['Date', 'Category', 'Amount', 'Description'];
		const rows = expenses.map((e) => [e.expense_date, e.category_name, e.amount, `"${e.description || ''}"`]);
		const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-black text-foreground flex items-center gap-2">
				<Receipt class="w-6 h-6 text-primary" />
				Expense History
			</h1>
			<p class="text-xs text-muted-foreground">Filter, search, and manage all your logged expenses</p>
		</div>

		<button
			on:click={handleExportCSV}
			disabled={expenses.length === 0}
			class="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
		>
			<FileSpreadsheet class="w-4 h-4 text-emerald-400" />
			Export CSV
		</button>
	</div>

	<!-- Filter Controls Card -->
	<div class="p-4 bg-card border border-border rounded-xl shadow-sm space-y-3">
		<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
			<Filter class="w-4 h-4 text-primary" /> Filter Transactions
		</div>

		<div class="grid grid-cols-1 md:grid-cols-4 gap-3">
			<!-- Keyword Search -->
			<div class="relative">
				<Search class="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search description..."
					bind:value={searchKey}
					on:input={loadData}
					class="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<!-- Category Filter -->
			<div>
				<select
					bind:value={categoryId}
					on:change={loadData}
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="">All Categories</option>
					{#each categories as cat}
						<option value={cat.name}>{cat.name}</option>
					{/each}
				</select>
			</div>

			<!-- Start Date -->
			<div>
				<input
					type="date"
					bind:value={startDate}
					on:change={loadData}
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<!-- End Date -->
			<div>
				<input
					type="date"
					bind:value={endDate}
					on:change={loadData}
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
		</div>
	</div>

	<!-- Expenses Table List -->
	<div class="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
		{#if loading}
			<div class="p-8 text-center text-xs text-muted-foreground">Loading transactions...</div>
		{:else if expenses.length === 0}
			<div class="p-8 text-center text-xs text-muted-foreground">No expenses found matching current filters.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs text-foreground">
					<thead class="bg-secondary/50 text-muted-foreground uppercase font-semibold border-b border-border">
						<tr>
							<th class="p-3">Date</th>
							<th class="p-3">Category</th>
							<th class="p-3">Description</th>
							<th class="p-3 text-right">Amount</th>
							<th class="p-3 text-center">Status</th>
							<th class="p-3 text-center">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each expenses as item}
							<tr class="hover:bg-muted/30 transition-colors">
								<td class="p-3 font-medium whitespace-nowrap">{formatDate(item.expense_date)}</td>
								<td class="p-3 whitespace-nowrap">
									<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style="background-color: {item.category_color || '#6b7280'};">
										{item.category_name}
									</span>
								</td>
								<td class="p-3 text-muted-foreground max-w-xs truncate">{item.description || '-'}</td>
								<td class="p-3 font-bold text-right whitespace-nowrap">{formatIDR(item.amount)}</td>
								<td class="p-3 text-center whitespace-nowrap">
									{#if item.is_upload}
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
											Synced
										</span>
									{:else}
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
											Pending
										</span>
									{/if}
								</td>
								<td class="p-3 text-center whitespace-nowrap">
									<button
										on:click={() => handleDelete(item.id)}
										title="Delete"
										class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
