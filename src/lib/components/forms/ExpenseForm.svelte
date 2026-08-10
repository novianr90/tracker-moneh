<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { expenseService } from '$lib/services/expenses';
	import { categoryService, type Category } from '$lib/services/categories';
	import { getTodayISODate } from '$lib/utils/formatters';
	import { Plus, Loader2, Check } from 'lucide-svelte';

	const dispatch = createEventDispatcher<{
		submitted: void;
		error: string;
	}>();

	export let onSuccess: (() => void) | undefined = undefined;

	import { paymentMethodService, type PaymentMethodItem } from '$lib/services/paymentMethods';

	let amount = '';
	let categoryId = '';
	let paymentMethod = 'Cash';
	let description = '';
	let expenseDate = getTodayISODate();

	let paymentMethodItems: PaymentMethodItem[] = [];
	let isAddingCustomMethod = false;
	let customMethodName = '';
	let savingCustomMethod = false;

	let categories: Category[] = [];
	let loading = false;
	let errorMsg = '';
	let successMsg = false;

	async function loadPaymentMethods() {
		try {
			paymentMethodItems = await paymentMethodService.getPaymentMethods();
			if (paymentMethodItems.length > 0 && !paymentMethodItems.some((item) => item.name === paymentMethod)) {
				paymentMethod = paymentMethodItems[0].name;
			}
		} catch (e) {
			console.error('Failed fetching payment methods:', e);
		}
	}

	onMount(async () => {
		try {
			const [catData, pmData] = await Promise.all([
				categoryService.getCategories(),
				paymentMethodService.getPaymentMethods()
			]);
			categories = catData;
			if (categories.length > 0) {
				categoryId = categories[0].id;
			}
			paymentMethodItems = pmData;
			if (paymentMethodItems.length > 0) {
				paymentMethod = paymentMethodItems[0].name;
			}
		} catch (e: any) {
			// Fallback mock categories if DB empty in dev
			categories = [
				{ id: '1', name: 'Food', icon: 'utensils', color: '#ef4444', user_id: '1', created_at: '' },
				{ id: '2', name: 'Coffee', icon: 'coffee', color: '#8b5cf6', user_id: '1', created_at: '' },
				{ id: '3', name: 'Transport', icon: 'car', color: '#3b82f6', user_id: '1', created_at: '' },
				{ id: '4', name: 'Bills', icon: 'file-text', color: '#f59e0b', user_id: '1', created_at: '' }
			];
			if (categories.length > 0) categoryId = categories[0].id;
		}
	});

	function handlePaymentMethodSelectChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		if (target.value === '__NEW_CUSTOM__') {
			isAddingCustomMethod = true;
		} else {
			isAddingCustomMethod = false;
			paymentMethod = target.value;
		}
	}

	async function handleSaveCustomMethod() {
		if (!customMethodName.trim()) return;
		savingCustomMethod = true;
		try {
			const newItem = await paymentMethodService.createPaymentMethod(customMethodName.trim());
			await loadPaymentMethods();
			paymentMethod = newItem.name;
			isAddingCustomMethod = false;
			customMethodName = '';
		} catch (err: any) {
			errorMsg = err.message || 'Failed to save custom payment method';
		} finally {
			savingCustomMethod = false;
		}
	}

	async function handleSubmit() {
		errorMsg = '';
		const parsedAmount = parseInt(amount.replace(/\D/g, ''), 10);

		if (!parsedAmount || parsedAmount <= 0) {
			errorMsg = 'EXP002: Please enter a valid amount > 0';
			return;
		}

		if (!categoryId) {
			errorMsg = 'EXP001: Please select a category';
			return;
		}

		loading = true;

		try {
			await expenseService.createExpense({
				amount: parsedAmount,
				category_id: categoryId,
				payment_method: paymentMethod,
				description: description.trim(),
				expense_date: expenseDate
			});

			// Reset form for rapid entry (<10s goal)
			amount = '';
			description = '';
			paymentMethod = 'Cash';
			successMsg = true;

			setTimeout(() => {
				successMsg = false;
			}, 2000);

			dispatch('submitted');
			if (onSuccess) onSuccess();
		} catch (err: any) {
			errorMsg = err.message || 'Failed to save expense';
			dispatch('error', errorMsg);
		} finally {
			loading = false;
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="p-6 bg-card border border-border rounded-xl shadow-lg space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-bold text-foreground flex items-center gap-2">
			<Plus class="w-5 h-5 text-primary" />
			Quick Expense Entry
		</h2>
		{#if successMsg}
			<span class="text-xs font-semibold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md flex items-center gap-1">
				<Check class="w-3 h-3" /> Saved!
			</span>
		{/if}
	</div>

	{#if errorMsg}
		<div class="p-3 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
			{errorMsg}
		</div>
	{/if}

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<!-- Amount Input -->
		<div>
			<label for="amount-input" class="block text-xs font-medium text-muted-foreground mb-1">Amount (IDR)</label>
			<div class="relative">
				<span class="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">Rp</span>
				<input
					id="amount-input"
					type="text"
					inputmode="numeric"
					placeholder="50.000"
					bind:value={amount}
					required
					class="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-semibold text-lg"
				/>
			</div>
		</div>

		<!-- Category Selector -->
		<div>
			<label for="category-select" class="block text-xs font-medium text-muted-foreground mb-1">Category</label>
			<select
				id="category-select"
				bind:value={categoryId}
				required
				class="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
			>
				{#each categories as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>

		<!-- Payment Method Selector -->
		<div>
			<label for="payment-method-select" class="block text-xs font-medium text-muted-foreground mb-1">Payment Method</label>
			{#if isAddingCustomMethod}
				<div class="flex items-center gap-1.5">
					<input
						type="text"
						placeholder="New method name..."
						bind:value={customMethodName}
						class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					/>
					<button
						type="button"
						on:click={handleSaveCustomMethod}
						disabled={savingCustomMethod}
						class="px-3 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-lg hover:bg-primary/90 disabled:opacity-50"
					>
						Add
					</button>
					<button
						type="button"
						on:click={() => (isAddingCustomMethod = false)}
						class="px-2 py-2 text-muted-foreground text-xs hover:text-foreground"
					>
						Cancel
					</button>
				</div>
			{:else}
				<select
					id="payment-method-select"
					bind:value={paymentMethod}
					on:change={handlePaymentMethodSelectChange}
					required
					class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
				>
					{#each paymentMethodItems as pm}
						<option value={pm.name}>{pm.name}</option>
					{/each}
					<option value="__NEW_CUSTOM__">+ Add Custom Payment Method...</option>
				</select>
			{/if}
		</div>

		<!-- Date Selector -->
		<div>
			<label for="expense-date" class="block text-xs font-medium text-muted-foreground mb-1">Date</label>
			<input
				id="expense-date"
				type="date"
				bind:value={expenseDate}
				required
				class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
			/>
		</div>

		<!-- Description Input -->
		<div class="md:col-span-2">
			<label for="description-input" class="block text-xs font-medium text-muted-foreground mb-1">Description (Optional)</label>
			<input
				id="description-input"
				type="text"
				placeholder="Coffee, Lunch, Petrol..."
				bind:value={description}
				class="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
			/>
		</div>
	</div>

	<button
		type="submit"
		disabled={loading}
		class="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
	>
		{#if loading}
			<Loader2 class="w-5 h-5 animate-spin" />
			Saving...
		{:else}
			<Plus class="w-5 h-5" />
			Save Expense (&lt; 10s)
		{/if}
	</button>
</form>
