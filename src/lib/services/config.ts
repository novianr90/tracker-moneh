import { apiFetch } from './apiClient';

export interface AppConfig {
	useActual: boolean;
	version?: string;
	actualSyncId?: string | null;
	billsCategoryId?: string | null;
}

export const configService = {
	async getConfig(): Promise<AppConfig> {
		try {
			const res = await fetch('/api/config');
			if (res.ok) {
				return await res.json();
			}
		} catch (e) {
			console.warn('Failed to load gateway config, defaulting to standalone:', e);
		}
		return { useActual: false, actualSyncId: null, billsCategoryId: null, version: '1.0.0' };
	},

	async setActualSyncId(actualSyncId: string | null): Promise<AppConfig> {
		return await apiFetch('/api/config/actual-sync-id', {
			method: 'PUT',
			body: JSON.stringify({ actualSyncId })
		});
	},

	async setBillsCategoryId(billsCategoryId: string | null): Promise<AppConfig> {
		return await apiFetch('/api/config/bills-category', {
			method: 'PUT',
			body: JSON.stringify({ billsCategoryId })
		});
	}
};
