<script lang="ts">
	import { onMount } from 'svelte';
	import { expenseService, type RecentExpenseView } from '$lib/services/expenses';
	import { categoryService, type Category } from '$lib/services/categories';
	import { paymentMethodService, type PaymentMethodItem } from '$lib/services/paymentMethods';
	import { formatIDR, formatDate } from '$lib/utils/formatters';
	import {
		Receipt,
		Search,
		Filter,
		Trash2,
		Pencil,
		Check,
		X,
		Loader2,
		FileSpreadsheet,
		ChevronLeft,
		ChevronRight,
		RefreshCw,
		CheckCircle2,
		AlertTriangle,
		Clock
	} from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

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
	let retryingId: string | null = null;
	let editForm = {
		expense_date: '',
		category_id: '',
		payment_method: 'Cash',
		payee: '',
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
			payee: item.payee || '',
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
		savingId = id;
		try {
			await expenseService.updateExpense(id, {
				expense_date: editForm.expense_date,
				category_id: editForm.category_id,
				payment_method: editForm.payment_method,
				payee: editForm.payee.trim() || null,
				amount: editForm.amount,
				description: editForm.description.trim()
			});
			editingId = null;
			await loadData();
		} catch (err: any) {
			alert(err.message || 'Failed to update expense');
		} finally {
			savingId = null;
		}
	}

	async function handleDelete(id: string, isUploaded: boolean) {
		const warning = isUploaded
			? 'This expense is already synced to Google Spreadsheet. Deleting it will mark it as [DELETED] on next Spreadsheet reconciliation. Continue?'
			: 'Are you sure you want to delete this expense?';

		if (!confirm(warning)) return;

		try {
			await expenseService.deleteExpense(id);
			await loadData();
		} catch (err: any) {
			alert(err.message || 'Failed to delete expense');
		}
	}

	async function handleRetry(id: string) {
		retryingId = id;
		try {
			await expenseService.retryExpense(id);
			await loadData();
		} catch (err: any) {
			alert(err.message || 'Failed to retry expense sync');
		} finally {
			retryingId = null;
		}
	}

	function handleExportCSV() {
		if (expenses.length === 0) return;
		const headers = ['Date', 'Category', 'Payment Method', 'Amount', 'Description', 'Actual Sync Status', 'Sheets Uploaded'];
		const rows = expenses.map((e) => [
			e.expense_date,
			e.category_name,
			e.payment_method || 'Cash',
			e.amount,
			`"${e.description || ''}"`,
			e.sync_status || 'PENDING',
			e.is_upload || 'N'
		]);
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
	<PageHeader icon={Receipt} title="Expense History" description="Filter, search, edit, and observe synchronization with Actual Budget & Google Sheets">
		<svelte:fragment slot="actions">
			<Button variant="secondary" size="sm" on:click={handleExportCSV} disabled={expenses.length === 0}>
				<FileSpreadsheet slot="icon" class="w-4 h-4 text-success" aria-hidden="true" />
				Export CSV
			</Button>
		</svelte:fragment>
	</PageHeader>

	<!-- Filter Controls Card -->
	<Card class="space-y-3">
		<div class="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
			<Filter class="w-4 h-4 text-primary" aria-hidden="true" /> Filter Transactions
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
			<!-- Keyword Search -->
			<div class="relative">
				<Search class="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
				<input
					type="text"
					placeholder="Search description..."
					aria-label="Search description"
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
					aria-label="Filter by category"
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
					aria-label="Filter by payment method"
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
					aria-label="Filter from date"
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<!-- End Date -->
			<div>
				<input
					type="date"
					bind:value={endDate}
					on:change={handleFilterChange}
					aria-label="Filter to date"
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
		</div>
	</Card>

	<!-- Expenses Table List -->
	<div class="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
		{#if loading}
			<div class="p-8 text-center text-xs text-muted-foreground">Loading transactions...</div>
		{:else if expenses.length === 0}
			<EmptyState icon={Receipt} message="No expenses found." hint="Try adjusting your filters, or add a new expense from the dashboard." />
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
							<th class="p-3 text-center">Actual Budget</th>
							<th class="p-3 text-center">Sheets</th>
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

									<!-- Description & Payee Input -->
									<td class="p-2 space-y-1">
										<input
											type="text"
											bind:value={editForm.payee}
											placeholder="Payee / Merchant..."
											class="w-full px-2 py-1 bg-background border border-input rounded text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										/>
										<input
											type="text"
											bind:value={editForm.description}
											placeholder="Description / Notes..."
											class="w-full px-2 py-1 bg-background border border-input rounded text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
										/>
									</td>

									<!-- Amount Input -->
									<td class="p-2 text-right whitespace-nowrap">
										<input
											type="number"
											bind:value={editForm.amount}
											min="1"
											aria-label="Amount"
											class="w-28 text-right px-2 py-1 bg-background border border-input rounded text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary tabular-nums"
										/>
									</td>

									<!-- Actual Budget Status (Read-only) -->
									<td class="p-3 text-center whitespace-nowrap">
										<span class="text-[10px] text-muted-foreground">{item.sync_status || 'PENDING'}</span>
									</td>

									<!-- Sheets Status (Read-only) -->
									<td class="p-3 text-center whitespace-nowrap">
										<span class="text-[10px] text-muted-foreground">{item.is_upload === 'Y' ? 'Synced' : 'Pending'}</span>
									</td>

									<!-- Save / Cancel Actions -->
									<td class="p-3 text-center whitespace-nowrap">
										<div class="flex items-center justify-center gap-1">
											<button
												on:click={() => handleSaveEdit(item.id)}
												disabled={savingId === item.id}
												title="Save"
												aria-label="Save expense"
												class="p-2 bg-success hover:bg-success/90 text-success-foreground rounded-md transition-colors disabled:opacity-50"
											>
												{#if savingId === item.id}
													<Loader2 class="w-4 h-4 animate-spin" aria-hidden="true" />
												{:else}
													<Check class="w-4 h-4" aria-hidden="true" />
												{/if}
											</button>
											<button
												on:click={handleCancelEdit}
												disabled={savingId === item.id}
												title="Cancel"
												aria-label="Cancel edit"
												class="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
											>
												<X class="w-4 h-4" aria-hidden="true" />
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
									<td class="p-3 max-w-xs">
										{#if item.payee}
											<div class="font-semibold text-foreground text-xs">{item.payee}</div>
										{/if}
										<div class="text-[11px] {item.payee ? 'text-muted-foreground' : 'text-foreground'} truncate">
											{item.description || (item.payee ? '' : '-')}
										</div>
									</td>
									<td class="p-3 font-bold text-right whitespace-nowrap tabular-nums">{formatIDR(item.amount)}</td>

									<!-- Actual Budget Status Badge -->
									<td class="p-3 text-center whitespace-nowrap">
										{#if item.sync_status === 'SYNCED'}
											<Badge variant="success">
												<CheckCircle2 slot="icon" class="w-3 h-3" aria-hidden="true" /> Synced
											</Badge>
										{:else if item.sync_status === 'RECONCILIATION_REQUIRED' || item.sync_status === 'ROLLBACK_PENDING'}
											<Badge variant="info" title="Reconciling with Actual Budget">
												<RefreshCw slot="icon" class="w-3 h-3 animate-spin" aria-hidden="true" />
												Reconciling
											</Badge>
										{:else if item.sync_status === 'SYNC_FAILED'}
											<Badge variant="danger" title="{item.sync_error || 'Actual write failed'} ({item.sync_failure_type || 'Error'})">
												<AlertTriangle slot="icon" class="w-3 h-3" aria-hidden="true" />
												Failed
											</Badge>
										{:else}
											<Badge variant="warning">
												<Clock slot="icon" class="w-3 h-3" aria-hidden="true" /> Pending
											</Badge>
										{/if}
									</td>

									<!-- Sheets Status -->
									<td class="p-3 text-center whitespace-nowrap">
										{#if item.is_upload === 'Y'}
											<Badge variant="success">Uploaded</Badge>
										{:else}
											<Badge variant="neutral">Pending</Badge>
										{/if}
									</td>

									<td class="p-3 text-center whitespace-nowrap">
										<div class="flex items-center justify-center gap-1">
											{#if item.sync_status === 'SYNC_FAILED'}
												<button
													on:click={() => handleRetry(item.id)}
													disabled={retryingId === item.id}
													title="Retry Actual Budget Sync"
													aria-label="Retry Actual Budget sync"
													class="p-2 text-warning hover:text-warning hover:bg-warning/10 rounded-md transition-colors disabled:opacity-50"
												>
													{#if retryingId === item.id}
														<Loader2 class="w-4 h-4 animate-spin" aria-hidden="true" />
													{:else}
														<RefreshCw class="w-4 h-4" aria-hidden="true" />
													{/if}
												</button>
											{/if}

											<button
												on:click={() => handleStartEdit(item)}
												disabled={item.is_upload === 'Y'}
												title={item.is_upload === 'Y' ? 'Synced expenses cannot be edited' : 'Edit Expense'}
												aria-label={item.is_upload === 'Y' ? 'Synced expenses cannot be edited' : 'Edit expense'}
												class="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:cursor-not-allowed"
											>
												<Pencil class="w-4 h-4" aria-hidden="true" />
											</button>
											<button
												on:click={() => handleDelete(item.id, item.is_upload === 'Y')}
												title="Delete Expense"
												aria-label="Delete expense"
												class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
											>
												<Trash2 class="w-4 h-4" aria-hidden="true" />
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
							<label for="page-size-select">Per page:</label>
							<select
								id="page-size-select"
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
								aria-label="Previous page"
								class="p-2 bg-background border border-input hover:bg-secondary rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<ChevronLeft class="w-4 h-4" aria-hidden="true" />
							</button>

							<span class="px-2 font-medium text-foreground">
								Page {page} of {totalPages}
							</span>

							<button
								on:click={() => handlePageChange(page + 1)}
								disabled={page >= totalPages}
								title="Next Page"
								aria-label="Next page"
								class="p-2 bg-background border border-input hover:bg-secondary rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<ChevronRight class="w-4 h-4" aria-hidden="true" />
							</button>
						</div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
