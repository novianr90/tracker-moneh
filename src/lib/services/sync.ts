import { supabase } from './supabase';
import type { Database } from '$lib/types/database.types';

export type SyncLog = Database['public']['Tables']['sync_logs']['Row'];

export const syncService = {
	async triggerGoogleSheetsSync(): Promise<{ status: string; syncedCount: number; message?: string }> {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) throw new Error('AUTH002: Session expired / Unauthorized');

		const response = await supabase.functions.invoke('sync-google-sheets', {
			headers: {
				Authorization: `Bearer ${session.access_token}`
			}
		});

		if (response.error) {
			throw new Error(response.error.message || 'SYNC003: Sync execution failed');
		}

		return response.data;
	},

	async getSyncLogs(limit = 20): Promise<SyncLog[]> {
		const { data, error } = await supabase
			.from('sync_logs')
			.select('*')
			.order('started_at', { ascending: false })
			.limit(limit);

		if (error) throw error;
		return data || [];
	},

	async getActiveCronJobs(): Promise<{ jobid: number; jobname: string; schedule: string; active: boolean }[]> {
		try {
			const { data, error } = await (supabase as any).rpc('get_cron_jobs');
			if (error) return [];
			return data || [];
		} catch {
			return [];
		}
	}
};
