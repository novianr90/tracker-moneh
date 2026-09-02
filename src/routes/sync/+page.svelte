<script lang="ts">
	import { onMount } from 'svelte';
	import {
		syncService,
		type SyncLog,
		type ActualSyncStatusSummary,
		type ReconciliationReport,
		type MasterDataSyncReport
	} from '$lib/services/sync';
	import { formatDate } from '$lib/utils/formatters';
	import {
		RefreshCw,
		CheckCircle2,
		XCircle,
		Clock,
		FileSpreadsheet,
		Loader2,
		AlertCircle,
		ShieldCheck,
		DatabaseZap,
		Layers,
		ArrowDownToLine
	} from 'lucide-svelte';

	// State for Actual Budget Sync
	let actualStatus: ActualSyncStatusSummary = { synced: 0, pending: 0, reconciling: 0, failed: 0, total: 0 };
	let reconcilingActual = false;
	let actualReport: ReconciliationReport | null = null;
	let actualStatusMsg = '';
	let actualErrorMsg = '';

	// State for Master Data Sync (Actual -> Supabase)
	let syncingMaster = false;
	let masterStatusMsg = '';
	let masterErrorMsg = '';

	// State for Google Sheets Sync (Preserved)
	let syncLogs: SyncLog[] = [];
	let cronJobs: { jobid: number; jobname: string; schedule: string; active: boolean }[] = [];
	let loading = true;
	let syncingSheets = false;
	let sheetsStatusMsg = '';
	let sheetsErrorMsg = '';

	async function loadData() {
		loading = true;
		try {
			const [status, logs, jobs] = await Promise.all([
				syncService.getActualSyncStatus().catch(() => ({ synced: 0, pending: 0, reconciling: 0, failed: 0, total: 0 })),
				syncService.getSyncLogs().catch(() => []),
				syncService.getActiveCronJobs().catch(() => [])
			]);
			actualStatus = status;
			syncLogs = logs;
			cronJobs = jobs;
		} catch (err: any) {
			console.error('Failed loading sync data:', err);
		} finally {
			loading = false;
		}
	}

	async function handleReconcileActual() {
		actualStatusMsg = '';
		actualErrorMsg = '';
		reconcilingActual = true;

		try {
			const res = await syncService.reconcileActualBudget();
			actualReport = res;
			actualStatusMsg = `Reconciliation completed: ${res.resolvedSynced} synced, ${res.advancedToPending} queued for retry, ${res.markedFailedDefinite} failed.`;
			await loadData();
		} catch (err: any) {
			actualErrorMsg = err.message || 'Actual Budget reconciliation failed';
		} finally {
			reconcilingActual = false;
		}
	}

	async function handleSyncMasterData() {
		masterStatusMsg = '';
		masterErrorMsg = '';
		syncingMaster = true;

		try {
			const res = await syncService.syncMasterData();
			const details = [];
			if (res.newCategories.length > 0) details.push(`+${res.newCategories.length} new categories (${res.newCategories.join(', ')})`);
			if (res.newAccounts.length > 0) details.push(`+${res.newAccounts.length} new accounts (${res.newAccounts.join(', ')})`);

			masterStatusMsg = `Master Data Synchronized! ${res.categoriesSynced} categories and ${res.accountsSynced} accounts verified. ${details.length > 0 ? details.join(' | ') : 'All categories & accounts already up-to-date.'}`;
		} catch (err: any) {
			masterErrorMsg = err.message || 'Failed to sync master data from Actual Budget';
		} finally {
			syncingMaster = false;
		}
	}

	async function handleTriggerSheetsSync() {
		sheetsStatusMsg = '';
		sheetsErrorMsg = '';
		syncingSheets = true;

		try {
			const res = await syncService.triggerGoogleSheetsSync();
			sheetsStatusMsg = `Successfully synced ${res.syncedCount} expenses to Google Spreadsheet!`;
			await loadData();
		} catch (err: any) {
			sheetsErrorMsg = err.message || 'SYNC003: Google Sheets sync failed';
		} finally {
			syncingSheets = false;
		}
	}

	onMount(() => {
		loadData();
	});
</script>

<div class="space-y-8">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-black text-foreground flex items-center gap-2">
			<RefreshCw class="w-6 h-6 text-primary" />
			Synchronization & Reconciliation Hub
		</h1>
		<p class="text-xs text-muted-foreground">Manage dual-synchronization with Actual Budget (System of Record) and Google Sheets (Reporting Layer)</p>
	</div>

	<!-- SECTION 1: Actual Budget Synchronization & Master Data -->
	<div class="p-6 bg-card border border-border rounded-xl shadow-lg space-y-6">
		<div class="flex items-start justify-between">
			<div class="space-y-1">
				<h2 class="text-md font-bold text-foreground flex items-center gap-2">
					<DatabaseZap class="w-5 h-5 text-primary" />
					Actual Budget (Financial System of Record)
				</h2>
				<p class="text-xs text-muted-foreground max-w-xl">
					Saga-orchestrated ledger synchronization and Master Data imports. Resolves timeouts, ambiguous writes, and syncs accounts/categories against <span class="font-mono text-foreground">budget.novianlabs.my.id</span>.
				</p>
			</div>

			{#if actualStatus.enabled === false}
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
					Disabled (USE_ACTUAL=false)
				</span>
			{:else}
				<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
					<ShieldCheck class="w-4 h-4" /> Active Saga Sync
				</span>
			{/if}
		</div>

		{#if actualStatus.enabled === false}
			<div class="p-3 text-xs bg-warning/10 border border-warning/30 text-warning rounded-lg flex items-center gap-2">
				<AlertCircle class="w-4 h-4 text-warning flex-shrink-0" />
				<span>Actual Budget transaction synchronization is paused (<code>USE_ACTUAL=false</code>). You can still import/sync Master Data (categories & accounts) anytime below so your dropdowns match Actual Budget.</span>
			</div>
		{/if}

		<!-- Status Metrics Cards -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			<div class="p-3 bg-secondary/40 border border-border rounded-lg text-center">
				<span class="text-[11px] text-muted-foreground uppercase font-semibold">Synced</span>
				<div class="text-xl font-bold text-success">{actualStatus.synced}</div>
			</div>
			<div class="p-3 bg-secondary/40 border border-border rounded-lg text-center">
				<span class="text-[11px] text-muted-foreground uppercase font-semibold">Pending Write</span>
				<div class="text-xl font-bold text-warning">{actualStatus.pending}</div>
			</div>
			<div class="p-3 bg-secondary/40 border border-border rounded-lg text-center">
				<span class="text-[11px] text-muted-foreground uppercase font-semibold">Reconciling</span>
				<div class="text-xl font-bold text-info">{actualStatus.reconciling}</div>
			</div>
			<div class="p-3 bg-secondary/40 border border-border rounded-lg text-center">
				<span class="text-[11px] text-muted-foreground uppercase font-semibold">Failed</span>
				<div class="text-xl font-bold text-destructive">{actualStatus.failed}</div>
			</div>
		</div>

		{#if actualStatusMsg}
			<div class="p-3 text-xs bg-success/20 border border-success/50 text-success rounded-lg flex items-center gap-2">
				<CheckCircle2 class="w-4 h-4 text-success flex-shrink-0" />
				<span>{actualStatusMsg}</span>
			</div>
		{/if}

		{#if actualErrorMsg}
			<div class="p-3 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg flex items-center gap-2">
				<AlertCircle class="w-4 h-4 text-destructive-foreground flex-shrink-0" />
				<span>{actualErrorMsg}</span>
			</div>
		{/if}

		{#if masterStatusMsg}
			<div class="p-3 text-xs bg-info/20 border border-info/50 text-info rounded-lg flex items-center gap-2">
				<CheckCircle2 class="w-4 h-4 text-info flex-shrink-0" />
				<span>{masterStatusMsg}</span>
			</div>
		{/if}

		{#if masterErrorMsg}
			<div class="p-3 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg flex items-center gap-2">
				<AlertCircle class="w-4 h-4 text-destructive-foreground flex-shrink-0" />
				<span>{masterErrorMsg}</span>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="flex flex-wrap gap-3">
			<button
				on:click={handleSyncMasterData}
				disabled={syncingMaster}
				class="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 border border-border"
			>
				{#if syncingMaster}
					<Loader2 class="w-4 h-4 animate-spin text-primary" /> Importing Master Data...
				{:else}
					<ArrowDownToLine class="w-4 h-4 text-primary" /> Sync Categories & Accounts from Actual
				{/if}
			</button>

			<button
				on:click={handleReconcileActual}
				disabled={reconcilingActual || actualStatus.enabled === false}
				class="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
			>
				{#if reconcilingActual}
					<Loader2 class="w-4 h-4 animate-spin" /> Running Reconciliation Engine...
				{:else}
					<RefreshCw class="w-4 h-4" /> Trigger Actual Budget Reconciliation
				{/if}
			</button>
		</div>
	</div>

	<!-- SECTION 2: Google Spreadsheet Reporting Layer (Preserved) -->
	<div class="p-6 bg-card border border-border rounded-xl shadow-lg space-y-6">
		<div class="flex items-start justify-between">
			<div class="space-y-1">
				<h2 class="text-md font-bold text-foreground flex items-center gap-2">
					<FileSpreadsheet class="w-5 h-5 text-success" />
					Google Spreadsheet (Reporting & Analytics)
				</h2>
				<p class="text-xs text-muted-foreground max-w-xl">
					One-way reconciliation of PostgreSQL expense entries with Google Spreadsheet for external dashboards and financial reporting.
				</p>
			</div>
		</div>

		{#if sheetsStatusMsg}
			<div class="p-3 text-xs bg-success/20 border border-success/50 text-success rounded-lg flex items-center gap-2">
				<CheckCircle2 class="w-4 h-4 text-success flex-shrink-0" />
				<span>{sheetsStatusMsg}</span>
			</div>
		{/if}

		{#if sheetsErrorMsg}
			<div class="p-3 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg flex items-center gap-2">
				<AlertCircle class="w-4 h-4 text-destructive-foreground flex-shrink-0" />
				<span>{sheetsErrorMsg}</span>
			</div>
		{/if}

		<button
			on:click={handleTriggerSheetsSync}
			disabled={syncingSheets}
			class="px-6 py-3 bg-success hover:bg-success/90 text-success-foreground font-bold text-sm rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
		>
			{#if syncingSheets}
				<Loader2 class="w-5 h-5 animate-spin" /> Syncing to Google Spreadsheet...
			{:else}
				<RefreshCw class="w-5 h-5" /> Sync to Spreadsheet Now
			{/if}
		</button>
	</div>

	<!-- SECTION 3: Google Sheets Sync Logs & Cron Jobs -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Sync Logs Table -->
		<div class="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
			<div class="p-4 border-b border-border flex items-center justify-between">
				<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
					<Clock class="w-4 h-4 text-primary" />
					Spreadsheet Sync Logs
				</h3>
				<span class="text-[10px] text-muted-foreground">Recent executions</span>
			</div>

			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs text-foreground">
					<thead class="bg-secondary/50 text-muted-foreground uppercase font-semibold border-b border-border">
						<tr>
							<th class="p-3">Started</th>
							<th class="p-3">Status</th>
							<th class="p-3 text-right">Synced Count</th>
							<th class="p-3">Error</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#if loading}
							<tr>
								<td colspan="4" class="p-6 text-center text-xs text-muted-foreground">Loading sync history...</td>
							</tr>
						{:else if syncLogs.length === 0}
							<tr>
								<td colspan="4" class="p-6 text-center text-xs text-muted-foreground">No sync logs recorded yet.</td>
							</tr>
						{:else}
							{#each syncLogs as log}
								<tr class="hover:bg-muted/30 transition-colors">
									<td class="p-3 font-medium whitespace-nowrap">{formatDate(log.started_at)}</td>
									<td class="p-3 whitespace-nowrap">
										{#if log.status === 'success'}
											<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20">
												<CheckCircle2 class="w-3 h-3" /> Success
											</span>
										{:else if log.status === 'in_progress'}
											<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-info/10 text-info border border-info/20">
												<RefreshCw class="w-3 h-3 animate-spin" /> Running
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/20">
												<XCircle class="w-3 h-3" /> Failed
											</span>
										{/if}
									</td>
									<td class="p-3 text-right font-bold whitespace-nowrap">{log.synced_count}</td>
									<td class="p-3 text-muted-foreground max-w-xs truncate">{log.error_message || '-'}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Active Cron Jobs -->
		<div class="bg-card border border-border rounded-xl shadow-sm p-4 space-y-4">
			<h3 class="text-sm font-bold text-foreground flex items-center gap-2">
				<Clock class="w-4 h-4 text-primary" />
				Scheduled Cron Jobs
			</h3>
			<p class="text-xs text-muted-foreground">Automated edge background sync schedules in Supabase pg_cron</p>

			<div class="space-y-3">
				{#if loading}
					<div class="text-xs text-muted-foreground">Loading schedules...</div>
				{:else if cronJobs.length === 0}
					<div class="p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground">
						No active pg_cron jobs found. Manual trigger is fully available.
					</div>
				{:else}
					{#each cronJobs as job}
						<div class="p-3 bg-secondary/30 border border-border rounded-lg space-y-1">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-foreground">{job.jobname}</span>
								<span class="text-[10px] font-mono px-1.5 py-0.5 rounded {job.active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}">
									{job.active ? 'Active' : 'Disabled'}
								</span>
							</div>
							<div class="text-[11px] font-mono text-muted-foreground">
								Schedule: {job.schedule}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>
