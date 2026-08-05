<script lang="ts">
	import { onMount } from 'svelte';
	import { syncService, type SyncLog } from '$lib/services/sync';
	import { formatDate } from '$lib/utils/formatters';
	import { RefreshCw, CheckCircle2, XCircle, Clock, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-svelte';

	let syncLogs: SyncLog[] = [];
	let loading = true;
	let syncing = false;
	let statusMsg = '';
	let errorMsg = '';

	async function loadLogs() {
		loading = true;
		try {
			syncLogs = await syncService.getSyncLogs();
		} catch (err: any) {
			console.error('Failed loading sync logs:', err);
		} finally {
			loading = false;
		}
	}

	async function handleTriggerSync() {
		statusMsg = '';
		errorMsg = '';
		syncing = true;

		try {
			const res = await syncService.triggerGoogleSheetsSync();
			statusMsg = `Successfully synced ${res.syncedCount} expenses to Google Spreadsheet!`;
			await loadLogs();
		} catch (err: any) {
			errorMsg = err.message || 'SYNC003: Edge Function sync failed';
		} finally {
			syncing = false;
		}
	}

	onMount(() => {
		loadLogs();
	});
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-black text-foreground flex items-center gap-2">
			<RefreshCw class="w-6 h-6 text-primary" />
			Google Spreadsheet Sync
		</h1>
		<p class="text-xs text-muted-foreground">One-way reconciliation to Google Sheets reporting layer</p>
	</div>

	<!-- Trigger Sync Action Card -->
	<div class="p-6 bg-card border border-border rounded-xl shadow-lg space-y-4">
		<div class="flex items-start justify-between">
			<div class="space-y-1">
				<h2 class="text-md font-bold text-foreground flex items-center gap-2">
					<FileSpreadsheet class="w-5 h-5 text-emerald-400" />
					Manual Reconciliation Trigger
				</h2>
				<p class="text-xs text-muted-foreground max-w-xl">
					Reconciles PostgreSQL expense entries with Google Spreadsheet using expense ID primary keys.
					Deleted items will be tagged with <span class="text-rose-400 font-mono">[DELETED]</span> and strikethrough styling.
				</p>
			</div>
		</div>

		{#if statusMsg}
			<div class="p-3 text-xs bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-lg flex items-center gap-2">
				<CheckCircle2 class="w-4 h-4 text-emerald-400 flex-shrink-0" />
				<span>{statusMsg}</span>
			</div>
		{/if}

		{#if errorMsg}
			<div class="p-3 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg flex items-center gap-2">
				<AlertCircle class="w-4 h-4 text-rose-400 flex-shrink-0" />
				<span>{errorMsg}</span>
			</div>
		{/if}

		<button
			on:click={handleTriggerSync}
			disabled={syncing}
			class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
		>
			{#if syncing}
				<Loader2 class="w-5 h-5 animate-spin" /> Syncing to Spreadsheet...
			{:else}
				<RefreshCw class="w-5 h-5" /> Sync to Spreadsheet Now
			{/if}
		</button>
	</div>

	<!-- Audit Log History -->
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-sm font-bold text-foreground">Sync Audit Logs (30-day Retention)</h2>
			<span class="text-xs text-muted-foreground">{syncLogs.length} Records</span>
		</div>

		{#if loading}
			<div class="text-center py-6 text-xs text-muted-foreground">Loading sync history logs...</div>
		{:else if syncLogs.length === 0}
			<div class="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
				No sync executions recorded yet.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs text-foreground">
					<thead class="bg-secondary/50 text-muted-foreground uppercase font-semibold border-b border-border">
						<tr>
							<th class="p-3">Started At</th>
							<th class="p-3">Status</th>
							<th class="p-3 text-right">Synced Count</th>
							<th class="p-3">Error / Note</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each syncLogs as log}
							<tr class="hover:bg-muted/30 transition-colors">
								<td class="p-3 whitespace-nowrap text-muted-foreground">{formatDate(log.started_at)} {new Date(log.started_at).toLocaleTimeString('id-ID')}</td>
								<td class="p-3 whitespace-nowrap">
									{#if log.status === 'success'}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400">
											<CheckCircle2 class="w-3 h-3" /> success
										</span>
									{:else if log.status === 'in_progress'}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400">
											<Clock class="w-3 h-3 animate-pulse" /> in_progress
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-400">
											<XCircle class="w-3 h-3" /> failed
										</span>
									{/if}
								</td>
								<td class="p-3 font-bold text-right whitespace-nowrap">{log.synced_count} items</td>
								<td class="p-3 text-muted-foreground max-w-xs truncate">{log.error_message || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
