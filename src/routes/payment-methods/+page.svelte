<script lang="ts">
	import { onMount } from 'svelte';
	import { paymentMethodService, type PaymentMethodItem } from '$lib/services/paymentMethods';
	import { CreditCard, Plus, Trash2, Loader2, Wallet } from 'lucide-svelte';

	let paymentMethods: PaymentMethodItem[] = [];
	let loading = true;
	let creating = false;

	let newName = '';
	let errorMsg = '';

	async function loadPaymentMethods() {
		loading = true;
		try {
			paymentMethods = await paymentMethodService.getPaymentMethods();
		} catch (err: any) {
			console.error('Failed loading payment methods:', err);
		} finally {
			loading = false;
		}
	}

	async function handleCreatePaymentMethod() {
		errorMsg = '';
		if (!newName.trim()) {
			errorMsg = 'Please enter payment method name';
			return;
		}

		creating = true;

		try {
			await paymentMethodService.createPaymentMethod(newName.trim());
			newName = '';
			await loadPaymentMethods();
		} catch (err: any) {
			errorMsg = err.message || 'Failed to create payment method';
		} finally {
			creating = false;
		}
	}

	async function handleDelete(item: PaymentMethodItem) {
		if (item.id.startsWith('default-')) {
			alert('Default payment methods cannot be deleted.');
			return;
		}
		if (!confirm(`Are you sure you want to delete payment method "${item.name}"?`)) return;
		try {
			await paymentMethodService.deletePaymentMethod(item.id);
			await loadPaymentMethods();
		} catch (err: any) {
			alert('Failed to delete payment method: ' + err.message);
		}
	}

	onMount(() => {
		loadPaymentMethods();
	});
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-black text-foreground flex items-center gap-2">
			<CreditCard class="w-6 h-6 text-primary" />
			Payment Methods & Wallets
		</h1>
		<p class="text-xs text-muted-foreground">Manage custom payment channels, bank accounts, and e-wallets</p>
	</div>

	<!-- Add Payment Method Form -->
	<div class="p-5 bg-card border border-border rounded-xl shadow-sm space-y-4">
		<h2 class="text-sm font-bold text-foreground flex items-center gap-2">
			<Plus class="w-4 h-4 text-primary" /> Add Custom Payment Method
		</h2>

		{#if errorMsg}
			<div class="p-2.5 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
				{errorMsg}
			</div>
		{/if}

		<form on:submit|preventDefault={handleCreatePaymentMethod} class="flex flex-col sm:flex-row gap-3 items-end">
			<div class="flex-1 w-full">
				<label for="pm-name-input" class="block text-xs font-medium text-muted-foreground mb-1">Method / Wallet Name</label>
				<input
					id="pm-name-input"
					type="text"
					placeholder="e.g. SeaBank, Mandiri, ShopeePay, Crypto Wallet..."
					bind:value={newName}
					required
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<button
				type="submit"
				disabled={creating}
				class="w-full sm:w-auto px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
			>
				{#if creating}
					<Loader2 class="w-4 h-4 animate-spin" /> Saving...
				{:else}
					<Plus class="w-4 h-4" /> Add Method
				{/if}
			</button>
		</form>
	</div>

	<!-- Payment Methods Grid -->
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
		<h2 class="text-sm font-bold text-foreground">Active Payment Methods ({paymentMethods.length})</h2>

		{#if loading}
			<div class="text-center py-6 text-xs text-muted-foreground">Loading payment methods...</div>
		{:else if paymentMethods.length === 0}
			<div class="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
				No payment methods found. Add your first custom wallet above!
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{#each paymentMethods as item}
					<div class="p-3 bg-secondary/40 border border-border rounded-lg flex items-center justify-between">
						<div class="flex items-center gap-2.5">
							<div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
								<Wallet class="w-4 h-4" />
							</div>
							<span class="text-xs font-semibold text-foreground">{item.name}</span>
						</div>
						{#if !item.id.startsWith('default-')}
							<button
								on:click={() => handleDelete(item)}
								title="Delete Payment Method"
								class="p-1 text-muted-foreground hover:text-destructive transition-colors"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
