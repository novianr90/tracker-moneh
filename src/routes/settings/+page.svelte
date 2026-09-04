<script lang="ts">
	import { onMount } from 'svelte';
	import { configService, type AppConfig } from '$lib/services/config';
	import { categoryService, type Category } from '$lib/services/categories';
	import { Settings, Save, CheckCircle2, AlertTriangle } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let loading = true;
	let saving = false;
	let cfg: AppConfig = { useActual: false, actualSyncId: null, billsCategoryId: null };
	let syncIdInput = '';
	let errorMsg = '';
	let successMsg = '';

	let categories: Category[] = [];
	let billsCategoryInput = '';
	let savingBillsCategory = false;
	let billsErrorMsg = '';
	let billsSuccessMsg = '';

	async function load() {
		loading = true;
		errorMsg = '';
		try {
			cfg = await configService.getConfig();
			syncIdInput = cfg.actualSyncId || '';
			billsCategoryInput = cfg.billsCategoryId || '';
		} catch (err: any) {
			errorMsg = err.message || 'Failed to load configuration';
		} finally {
			loading = false;
		}

		try {
			categories = await categoryService.getCategories();
		} catch (err: any) {
			console.error('Failed loading categories:', err);
		}
	}

	async function handleSave() {
		errorMsg = '';
		successMsg = '';
		saving = true;
		try {
			const result = await configService.setActualSyncId(syncIdInput.trim() || null);
			cfg = { ...cfg, ...result };
			syncIdInput = cfg.actualSyncId || '';
			successMsg = 'Actual Budget sync ID saved.';
		} catch (err: any) {
			errorMsg = err.message || 'Failed to save configuration';
		} finally {
			saving = false;
		}
	}

	async function handleSaveBillsCategory() {
		billsErrorMsg = '';
		billsSuccessMsg = '';
		savingBillsCategory = true;
		try {
			const result = await configService.setBillsCategoryId(billsCategoryInput || null);
			cfg = { ...cfg, billsCategoryId: result.billsCategoryId };
			billsCategoryInput = cfg.billsCategoryId || '';
			billsSuccessMsg = 'Bills category saved.';
		} catch (err: any) {
			billsErrorMsg = err.message || 'Failed to save Bills category';
		} finally {
			savingBillsCategory = false;
		}
	}

	onMount(load);
</script>

<div class="space-y-6 max-w-xl">
	<!-- Page Header -->
	<PageHeader icon={Settings} title="Settings" description="Manage your personal Actual Budget connection" />

	{#if loading}
		<div class="text-center py-6 text-xs text-muted-foreground">Loading configuration...</div>
	{:else}
		<Card class="space-y-4">
			<h2 class="text-sm font-heading font-semibold text-foreground">Actual Budget Sync ID</h2>

			{#if !cfg.useActual}
				<div class="p-3 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground">
					Actual Budget integration is currently disabled on this Gateway (<code class="bg-card px-1 rounded">USE_ACTUAL=false</code>).
					Expenses are tracked in Tracker only.
				</div>
			{:else if !cfg.actualSyncId}
				<div class="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2 text-xs text-warning">
					<AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
					<span>Your Actual sync ID is empty. Set it below to start syncing your expenses to your own Actual Budget.</span>
				</div>
			{/if}

			{#if errorMsg}
				<div class="p-2.5 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
					{errorMsg}
				</div>
			{/if}
			{#if successMsg}
				<div class="p-2.5 text-xs bg-primary/10 border border-primary/20 text-primary rounded-lg flex items-center gap-1.5">
					<CheckCircle2 class="w-4 h-4" aria-hidden="true" /> {successMsg}
				</div>
			{/if}

			<form on:submit|preventDefault={handleSave} class="space-y-3">
				<div>
					<label for="sync-id-input" class="block text-xs font-medium text-muted-foreground mb-1">
						Sync ID
					</label>
					<input
						id="sync-id-input"
						type="text"
						placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
						bind:value={syncIdInput}
						disabled={!cfg.useActual}
						class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
					/>
					<p class="text-[10px] text-muted-foreground mt-1">
						Found in your Actual Budget app under Settings &rarr; Show advanced settings &rarr; Sync ID. Leave blank to disable syncing for your account.
					</p>
				</div>

				<Button type="submit" variant="primary" size="sm" loading={saving} disabled={!cfg.useActual} class="w-full">
					<Save slot="icon" class="w-4 h-4" aria-hidden="true" />
					{saving ? 'Saving...' : 'Save'}
				</Button>
			</form>
		</Card>

		<Card class="space-y-4">
			<h2 class="text-sm font-heading font-semibold text-foreground">Bills Category</h2>

			{#if !billsCategoryInput}
				<div class="p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-2 text-xs text-warning">
					<AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
					<span>No Bills category set. Credit Card / paylater auto-adjust will silently do nothing until this is configured.</span>
				</div>
			{/if}

			{#if billsErrorMsg}
				<div class="p-2.5 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
					{billsErrorMsg}
				</div>
			{/if}
			{#if billsSuccessMsg}
				<div class="p-2.5 text-xs bg-primary/10 border border-primary/20 text-primary rounded-lg flex items-center gap-1.5">
					<CheckCircle2 class="w-4 h-4" aria-hidden="true" /> {billsSuccessMsg}
				</div>
			{/if}

			<form on:submit|preventDefault={handleSaveBillsCategory} class="space-y-3">
				<div>
					<label for="bills-category-select" class="block text-xs font-medium text-muted-foreground mb-1">
						Category
					</label>
					<select
						id="bills-category-select"
						bind:value={billsCategoryInput}
						class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<option value="">None</option>
						{#each categories as category}
							<option value={category.id}>{category.name}</option>
						{/each}
					</select>
					<p class="text-[10px] text-muted-foreground mt-1">
						Transactions on Credit Card / paylater accounts will auto-increase this category's budget next month.
					</p>
				</div>

				<Button type="submit" variant="primary" size="sm" loading={savingBillsCategory} class="w-full">
					<Save slot="icon" class="w-4 h-4" aria-hidden="true" />
					{savingBillsCategory ? 'Saving...' : 'Save'}
				</Button>
			</form>
		</Card>
	{/if}
</div>
