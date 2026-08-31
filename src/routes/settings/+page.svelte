<script lang="ts">
	import { onMount } from 'svelte';
	import { configService, type AppConfig } from '$lib/services/config';
	import { Settings, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-svelte';

	let loading = true;
	let saving = false;
	let cfg: AppConfig = { useActual: false, actualSyncId: null };
	let syncIdInput = '';
	let errorMsg = '';
	let successMsg = '';

	async function load() {
		loading = true;
		errorMsg = '';
		try {
			cfg = await configService.getConfig();
			syncIdInput = cfg.actualSyncId || '';
		} catch (err: any) {
			errorMsg = err.message || 'Failed to load configuration';
		} finally {
			loading = false;
		}
	}

	async function handleSave() {
		errorMsg = '';
		successMsg = '';
		saving = true;
		try {
			cfg = await configService.setActualSyncId(syncIdInput.trim() || null);
			syncIdInput = cfg.actualSyncId || '';
			successMsg = 'Actual Budget sync ID saved.';
		} catch (err: any) {
			errorMsg = err.message || 'Failed to save configuration';
		} finally {
			saving = false;
		}
	}

	onMount(load);
</script>

<div class="space-y-6 max-w-xl">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-black text-foreground flex items-center gap-2">
			<Settings class="w-6 h-6 text-primary" />
			Settings
		</h1>
		<p class="text-xs text-muted-foreground">Manage your personal Actual Budget connection</p>
	</div>

	{#if loading}
		<div class="text-center py-6 text-xs text-muted-foreground">Loading configuration...</div>
	{:else}
		<div class="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
			<h2 class="text-sm font-bold text-foreground">Actual Budget Sync ID</h2>

			{#if !cfg.useActual}
				<div class="p-3 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground">
					Actual Budget integration is currently disabled on this Gateway (<code class="bg-card px-1 rounded">USE_ACTUAL=false</code>).
					Expenses are tracked in Tracker only.
				</div>
			{:else if !cfg.actualSyncId}
				<div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
					<AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
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
					<CheckCircle2 class="w-4 h-4" /> {successMsg}
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

				<button
					type="submit"
					disabled={saving || !cfg.useActual}
					class="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
				>
					{#if saving}
						<Loader2 class="w-4 h-4 animate-spin" /> Saving...
					{:else}
						<Save class="w-4 h-4" /> Save
					{/if}
				</button>
			</form>
		</div>
	{/if}
</div>
