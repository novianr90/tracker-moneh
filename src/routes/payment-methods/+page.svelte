<script lang="ts">
	import { onMount } from 'svelte';
	import { paymentMethodService, type PaymentMethodItem } from '$lib/services/paymentMethods';
	import { configService } from '$lib/services/config';
	import { CreditCard, Plus, Trash2, Info } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let paymentMethods: PaymentMethodItem[] = [];
	let loading = true;
	let creating = false;
	let useActual = false;

	let newName = '';
	let errorMsg = '';

	async function loadPaymentMethods() {
		loading = true;

		configService.getConfig().then(cfg => {
			useActual = cfg.useActual;
		}).catch(console.error);

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

	async function handleToggleCreditCard(item: PaymentMethodItem) {
		if (item.id.startsWith('default-')) return;

		const nextValue = !item.is_credit_card;
		// optimistic update
		paymentMethods = paymentMethods.map(pm =>
			pm.id === item.id ? { ...pm, is_credit_card: nextValue } : pm
		);

		try {
			await paymentMethodService.updatePaymentMethod(item.id, { is_credit_card: nextValue });
		} catch (err: any) {
			// revert on failure
			paymentMethods = paymentMethods.map(pm =>
				pm.id === item.id ? { ...pm, is_credit_card: !nextValue } : pm
			);
			errorMsg = err.message || 'Failed to update credit card flag';
		}
	}

	onMount(() => {
		loadPaymentMethods();
	});
</script>

<div class="space-y-6">
	<PageHeader icon={CreditCard} title="Payment Methods & Wallets" description="Manage custom payment channels, bank accounts, and e-wallets" />

	{#if errorMsg}
		<div role="alert" class="p-2.5 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
			{errorMsg}
		</div>
	{/if}

	<!-- Info Notice if USE_ACTUAL=true -->
	{#if useActual}
		<div class="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
			<Info class="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
			<div class="text-xs space-y-1">
				<p class="font-bold text-foreground">Master Data Dikelola oleh Actual Budget</p>
				<p class="text-muted-foreground">
					Akun pembayaran disinkronkan secara otomatis dari Actual Budget (<code class="bg-card px-1 rounded">USE_ACTUAL=true</code>). Untuk menambah atau menutup akun, kelola di Actual Budget lalu klik <a href="/sync" class="text-primary font-semibold hover:underline">Sync Master Data</a> di menu Sync.
				</p>
			</div>
		</div>
	{/if}

	<!-- Add Payment Method Form (Only visible when USE_ACTUAL=false) -->
	{#if !useActual}
		<Card class="space-y-4">
			<h2 class="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
				<Plus class="w-4 h-4 text-primary" aria-hidden="true" /> Add Custom Payment Method
			</h2>

			<form on:submit|preventDefault={handleCreatePaymentMethod} class="flex flex-col sm:flex-row gap-3 items-end">
				<div class="flex-1 w-full">
					<label for="pm-name-input" class="block text-xs font-medium text-muted-foreground mb-1">Method / Wallet Name</label>
					<input
						id="pm-name-input"
						type="text"
						placeholder="e.g. SeaBank, Mandiri, ShopeePay, Crypto Wallet..."
						bind:value={newName}
						required
						aria-invalid={!!errorMsg}
						class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<Button type="submit" variant="primary" size="md" loading={creating} class="w-full sm:w-auto">
					<Plus slot="icon" class="w-4 h-4" aria-hidden="true" />
					{creating ? 'Adding...' : 'Add Method'}
				</Button>
			</form>
		</Card>
	{/if}

	<!-- Payment Methods List -->
	<Card class="space-y-4">
		<h2 class="text-sm font-heading font-semibold text-foreground">Available Payment Channels ({paymentMethods.length})</h2>

		{#if loading}
			<div class="text-center py-6 text-xs text-muted-foreground">Loading payment methods...</div>
		{:else if paymentMethods.length === 0}
			<EmptyState icon={CreditCard} message="No payment methods found." hint="Add one above to get started." />
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{#each paymentMethods as item}
					{@const isDefault = item.id.startsWith('default-')}
					<div class="p-3 bg-secondary/40 border border-border rounded-lg flex items-center justify-between gap-2">
						<div class="flex items-center gap-2.5 min-w-0">
							<div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0" aria-hidden="true">
								{item.name.substring(0, 2).toUpperCase()}
							</div>
							<div class="min-w-0">
								<span class="text-xs font-semibold block truncate {item.is_active === false ? 'line-through text-muted-foreground' : 'text-foreground'}">{item.name}</span>
								<div class="flex items-center gap-1.5 mt-0.5">
									<span class="text-[10px] text-muted-foreground">{isDefault ? 'Default' : 'Custom'}</span>
									{#if item.is_active === false}
										<Badge variant="neutral">Inactive</Badge>
									{/if}
									{#if item.is_credit_card}
										<Badge variant="info">Credit Card</Badge>
									{/if}
								</div>
							</div>
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<button
								on:click={() => handleToggleCreditCard(item)}
								disabled={isDefault}
								title={isDefault ? 'Not available on default methods' : item.is_credit_card ? 'Unmark as Credit Card / paylater' : 'Mark as Credit Card / paylater'}
								aria-pressed={!!item.is_credit_card}
								aria-label={`Toggle credit card flag for ${item.name}`}
								class="p-2 rounded-md transition-colors {item.is_credit_card ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'} disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<CreditCard class="w-4 h-4" aria-hidden="true" />
							</button>
							{#if !isDefault && !useActual}
								<button
									on:click={() => handleDelete(item)}
									title="Delete Payment Method"
									aria-label={`Delete payment method ${item.name}`}
									class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
								>
									<Trash2 class="w-4 h-4" aria-hidden="true" />
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>
