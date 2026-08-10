<script lang="ts">
	import { onMount } from 'svelte';
	import { expenseService, type RecentExpenseView } from '$lib/services/expenses';
	import { categoryService, type Category } from '$lib/services/categories';
	import { paymentMethodService, type PaymentMethodItem } from '$lib/services/paymentMethods';
	import { formatIDR, formatDate } from '$lib/utils/formatters';
	import { Receipt, Search, Filter, Trash2, Pencil, Check, X, Loader2, Calendar, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-svelte';

	let expenses: RecentExpenseView[] = [];
	let categories: Category[] = [];
	let paymentMethodsList: PaymentMethodItem[] = [];
	let loading = true;

	// Filter state
	let searchKey = '';
	let categoryId = '';
	let paymentMethodFilter = '';
	let startDate = '';
	let endDate = '';

	// Pagination state
	let page = 1;
	let pageSize = 25;
	let totalCount = 0;
	let totalPages = 1;

	// Inline Edit State
	let editingId: string | null = null;
	let savingId: string | null = null;
	let editForm = {
		expense_date: '',
		category_id: '',
		payment_method: 'Cash',
		amount: 0,
		description: ''
	};

	async function loadData() {
		loading = true;
		try {
			const [paginatedRes, catData, pmData] = await Promise.all([
				expenseService.getExpenses({
					searchKey: searchKey || undefined,
					categoryId: categoryId || undefined,
					paymentMethod: paymentMethodFilter || undefined,
					startDate: startDate || undefined,
					endDate: endDate || undefined,
					page,
					pageSize
				}),
				categoryService.getCategories(),
				paymentMethodService.getPaymentMethods()
			]);
			expenses = paginatedRes.data;
			totalCount = paginatedRes.totalCount;
			totalPages = paginatedRes.totalPages;
			page = paginatedRes.page;
			pageSize = paginatedRes.pageSize;
			categories = catData;
			paymentMethodsList = pmData;
		} catch (err: any) {
			console.error('Failed loading expenses:', err);
		} finally {
			loading = false;
		}
	}

	function handleFilterChange() {
		page = 1;
		loadData();
	}

	function handlePageChange(newPage: number) {
		if (newPage >= 1 && newPage <= totalPages) {
			page = newPage;
			loadData();
		}
	}

	function handlePageSizeChange(newSize: number) {
		pageSize = newSize;
		page = 1;
		loadData();
	}

	function handleStartEdit(item: RecentExpenseView) {
		if (item.is_upload === 'Y') {
			alert('Expenses that have already been synced to Google Sheets cannot be edited.');
			return;
		}
		const matchedCat = categories.find((c) => c.name === item.category_name);
		editingId = item.id;
		editForm = {
			expense_date: item.expense_date,
			category_id: matchedCat ? matchedCat.id : (item as any).category_id || (categories[0]?.id ?? ''),
			payment_method: item.payment_method || 'Cash',
			amount: item.amount,
			description: item.description || ''
		};
	}

	function handleCancelEdit() {
		editingId = null;
	}

	async function handleSaveEdit(id: string) {
		if (editForm.amount <= 0) {
			alert('Amount must be greater than 0');
			return;
		}
		if (!editForm.category_id) {
			alert('Please select a category');
			return;
		}

		savingId = id;
		try {
			await expenseService.updateExpense(id, {
				expense_date: editForm.expense_date,
				category_id: editForm.category_id,
				payment_method: editForm.payment_method,
				amount: editForm.amount,
				description: editForm.description.trim()
			});
			editingId = null;
			await loadData();
		} catch (err: any) {
			alert('Failed to save expense edit: ' + (err.message || err));
		} finally {
			savingId = null;
		}
	}

	async function handleDelete(id: string, isSynced: boolean = false) {
		const confirmMessage = isSynced
			? 'Transaksi ini sudah di-sync ke Google Sheet. Menghapusnya akan menandai transaksi tersebut sebagai [DELETED] (dicoret) pada sync berikutnya.\n\nYakin ingin menghapus?'
			: 'Apakah Anda yakin ingin menghapus transaksi ini?';

		if (!confirm(confirmMessage)) return;
		try {
			await expenseService.deleteExpense(id);
			await loadData();
		} catch (err: any) {
			alert('Failed to delete expense: ' + err.message);
		}
	}

	function handleExportCSV() {
		if (expenses.length === 0) return;
		const headers = ['Date', 'Category', 'Payment Method', 'Amount', 'Description'];
		const rows = expenses.map((e) => [e.expense_date, e.category_name, e.payment_method || 'Cash', e.amount, `"${e.description || ''}"`]);
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
			<p class="text-xs text-muted-foreground">Filter, search, edit, and manage all your logged expenses</p>
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

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
			<!-- Keyword Search -->
			<div class="relative">
				<Search class="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search description..."
					bind:value={searchKey}
					on:input={handleFilterChange}
					class="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<!-- Category Filter -->
			<div>
				<select
					bind:value={categoryId}
					on:change={handleFilterChange}
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="">All Categories</option>
					{#each categories as cat}
						<option value={cat.name}>{cat.name}</option>
					{/each}
				</select>
			</div>

			<!-- Payment Method Filter -->
			<div>
				<select
					bind:value={paymentMethodFilter}
					on:change={handleFilterChange}
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="">All Payment Methods</option>
					{#each paymentMethodsList as pm}
						<option value={pm.name}>{pm.name}</option>
					{/each}
				</select>
			</div>

			<!-- Start Date -->
			<div>
				<input
					type="date"
					bind:value={startDate}
					on:change={handleFilterChange}
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<!-- End Date -->
			<div>
				<input
					type="date"
					bind:value={endDate}
					on:change={handleFilterChange}
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
							<th class="p-3">Payment Method</th>
							<th class="p-3">Description</th>
							<th class="p-3 text-right">Amount</th>
							<th class="p-3 text-center">Status</th>
							<th class="p-3 text-center">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each expenses as item}
							{#if editingId === item.id}
								<!-- EDIT MODE ROW -->
								<tr class="bg-primary/5 border-l-4 border-l-primary transition-colors">
									<!-- Date Input -->
									<td class="p-2 whitespace-nowrap">
										<input
											type="date"
											bind:value={editForm.expense_date}
											class="px-2 py-1 bg-background border border-input rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										/>
									</td>

									<!-- Category Input -->
									<td class="p-2 whitespace-nowrap">
										<select
											bind:value={editForm.category_id}
											class="px-2 py-1 bg-background border border-input rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										>
											{#each categories as cat}
												<option value={cat.id}>{cat.name}</option>
											{/each}
										</select>
									</td>

									<!-- Payment Method Input -->
									<td class="p-2 whitespace-nowrap">
										<select
											bind:value={editForm.payment_method}
											class="px-2 py-1 bg-background border border-input rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										>
											{#each paymentMethodsList as pm}
												<option value={pm.name}>{pm.name}</option>
											{/each}
										</select>
									</td>

									<!-- Description Input -->
									<td class="p-2">
										<input
											type="text"
											bind:value={editForm.description}
											placeholder="Description..."
											class="w-full px-2 py-1 bg-background border border-input rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										/>
									</td>

									<!-- Amount Input -->
									<td class="p-2 text-right whitespace-nowrap">
										<input
											type="number"
											bind:value={editForm.amount}
											min="1"
											class="w-28 text-right px-2 py-1 bg-background border border-input rounded text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										/>
									</td>

									<!-- Status (Read-only) -->
									<td class="p-3 text-center whitespace-nowrap">
										{#if item.is_upload === 'Y'}
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
												Synced
											</span>
										{:else}
											<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
												Pending
											</span>
										{/if}
									</td>

									<!-- Save / Cancel Actions -->
									<td class="p-3 text-center whitespace-nowrap">
										<div class="flex items-center justify-center gap-1">
											<button
												on:click={() => handleSaveEdit(item.id)}
												disabled={savingId === item.id}
												title="Save"
												class="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-50"
											>
												{#if savingId === item.id}
													<Loader2 class="w-4 h-4 animate-spin" />
												{:else}
													<Check class="w-4 h-4" />
												{/if}
											</button>
											<button
												on:click={handleCancelEdit}
												disabled={savingId === item.id}
												title="Cancel"
												class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
											>
												<X class="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							{:else}
								<!-- READ-ONLY ROW -->
								<tr class="hover:bg-muted/30 transition-colors">
									<td class="p-3 font-medium whitespace-nowrap">{formatDate(item.expense_date)}</td>
									<td class="p-3 whitespace-nowrap">
										<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white" style="background-color: {item.category_color || '#6b7280'};">
											{item.category_name}
										</span>
									</td>
									<td class="p-3 whitespace-nowrap">
										<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-secondary text-foreground border border-border">
											{item.payment_method || 'Cash'}
										</span>
									</td>
									<td class="p-3 text-muted-foreground max-w-xs truncate">{item.description || '-'}</td>
									<td class="p-3 font-bold text-right whitespace-nowrap">{formatIDR(item.amount)}</td>
									<td class="p-3 text-center whitespace-nowrap">
										{#if item.is_upload === 'Y'}
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
										<div class="flex items-center justify-center gap-1">
											<button
												on:click={() => handleStartEdit(item)}
												disabled={item.is_upload === 'Y'}
												title={item.is_upload === 'Y' ? 'Synced expenses cannot be edited' : 'Edit Expense'}
												class="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:cursor-not-allowed"
											>
												<Pencil class="w-4 h-4" />
											</button>
											<button
												on:click={() => handleDelete(item.id, item.is_upload === 'Y')}
												title="Delete Expense"
												class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
											>
												<Trash2 class="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination Bar -->
			{#if totalCount > 0}
				<div class="px-4 py-3 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
					<div class="flex items-center gap-1.5">
						<span>Showing</span>
						<span class="font-bold text-foreground">
							{Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(page * pageSize, totalCount)}
						</span>
						<span>of</span>
						<span class="font-bold text-foreground">{totalCount}</span>
						<span>expenses</span>
					</div>

					<div class="flex items-center gap-4">
						<div class="flex items-center gap-1.5">
							<span>Per page:</span>
							<select
								bind:value={pageSize}
								on:change={() => handlePageSizeChange(pageSize)}
								class="px-2 py-1 bg-background border border-input rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
							>
								<option value={10}>10</option>
								<option value={25}>25</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</div>

						<div class="flex items-center gap-1.5">
							<button
								on:click={() => handlePageChange(page - 1)}
								disabled={page <= 1}
								title="Previous Page"
								class="p-1.5 bg-background border border-input hover:bg-secondary rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<ChevronLeft class="w-4 h-4" />
							</button>

							<span class="px-2 font-medium text-foreground">
								Page {page} of {totalPages}
							</span>

							<button
								on:click={() => handlePageChange(page + 1)}
								disabled={page >= totalPages}
								title="Next Page"
								class="p-1.5 bg-background border border-input hover:bg-secondary rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<ChevronRight class="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

