<script lang="ts">
	import { onMount } from 'svelte';
	import { syncService, type SyncLog } from '$lib/services/sync';
	import { formatDate } from '$lib/utils/formatters';
	import { RefreshCw, CheckCircle2, XCircle, Clock, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-svelte';

	let syncLogs: SyncLog[] = [];
	let cronJobs: { jobid: number; jobname: string; schedule: string; active: boolean }[] = [];
	let loading = true;
	let syncing = false;
	let statusMsg = '';
	let errorMsg = '';

	async function loadData() {
		loading = true;
		try {
			const [logs, jobs] = await Promise.all([
				syncService.getSyncLogs(),
				syncService.getActiveCronJobs()
			]);
			syncLogs = logs;
			cronJobs = jobs;
		} catch (err: any) {
			console.error('Failed loading sync data:', err);
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
			await loadData();
		} catch (err: any) {
			errorMsg = err.message || 'SYNC003: Edge Function sync failed';
		} finally {
			syncing = false;
		}
	}

	onMount(() => {
		loadData();
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

	<!-- Live Scheduled Cron Job Status Card -->
	<div class="p-6 bg-card border border-border rounded-xl shadow-sm space-y-4">
		<div class="flex items-center justify-between">
			<div class="space-y-1">
				<h2 class="text-md font-bold text-foreground flex items-center gap-2">
					<Clock class="w-5 h-5 text-primary" />
					Scheduled Auto-Sync Status
				</h2>
				<p class="text-xs text-muted-foreground">
					Live background schedule status fetched directly from database <code class="text-primary font-mono">cron.job</code>
				</p>
			</div>
			{#if cronJobs.length > 0}
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
					<CheckCircle2 class="w-4 h-4" /> Active Cron Schedule
				</span>
			{:else}
				<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
					<Clock class="w-4 h-4" /> Manual Sync Only
				</span>
			{/if}
		</div>

		{#if cronJobs.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
				{#each cronJobs as job}
					<div class="p-3.5 bg-secondary/30 border border-border rounded-lg space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="text-xs font-bold text-foreground">{job.jobname || 'Scheduled Job'}</span>
							<span class="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
								Active
							</span>
						</div>
						<div class="text-xs text-muted-foreground flex items-center gap-2">
							<span>Frequency Schedule:</span>
							<code class="px-2 py-0.5 bg-background border border-border rounded font-mono text-[11px] text-primary">{job.schedule}</code>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-3.5 bg-secondary/30 border border-border rounded-lg text-xs text-muted-foreground flex items-center justify-between">
				<span>No active background schedule found in <code class="text-primary font-mono">cron.job</code>. Sync runs manually on demand.</span>
				<span class="text-[11px] text-muted-foreground">See <code class="text-primary font-mono">SCHEDULED.md</code> for setup instructions.</span>
			</div>
		{/if}
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
