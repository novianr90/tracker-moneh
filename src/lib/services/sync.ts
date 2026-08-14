import { apiFetch } from './apiClient';
import type { Database } from '$lib/types/database.types';

export type SyncLog = Database['public']['Tables']['sync_logs']['Row'];

export interface ActualSyncStatusSummary {
	enabled?: boolean;
	synced: number;
	pending: number;
	reconciling: number;
	failed: number;
	total: number;
}

export interface ReconciliationReport {
	scanned: number;
	resolvedSynced: number;
	advancedToPending: number;
	markedFailedDefinite: number;
	exhausted: number;
	errors: Array<{ expenseId: string; error: string }>;
}

export interface MasterDataSyncReport {
	accountsSynced: number;
	categoriesSynced: number;
	newAccounts: string[];
	newCategories: string[];
}

export const syncService = {
	// ==========================================
	// Actual Budget Reconciliation & Master Data
	// ==========================================
	async reconcileActualBudget(): Promise<ReconciliationReport> {
		return await apiFetch('/api/sync/actual/reconcile', {
			method: 'POST'
		});
	},

	async syncMasterData(): Promise<MasterDataSyncReport> {
		return await apiFetch('/api/sync/actual/master-data', {
			method: 'POST'
		});
	},

	async getActualSyncStatus(): Promise<ActualSyncStatusSummary> {
		return await apiFetch('/api/sync/actual/status');
	},

	// ==========================================
	// Google Sheets Reporting Services (Preserved)
	// ==========================================
	async triggerGoogleSheetsSync(): Promise<{ status: string; syncedCount: number; message?: string }> {
		return await apiFetch('/api/sync/spreadsheet/trigger', {
			method: 'POST'
		});
	},

	async getSyncLogs(limit = 20): Promise<SyncLog[]> {
		return await apiFetch(`/api/sync/logs?limit=${limit}`);
	},

	async getActiveCronJobs(): Promise<{ jobid: number; jobname: string; schedule: string; active: boolean }[]> {
		return await apiFetch('/api/sync/cron-jobs');
	}
};
