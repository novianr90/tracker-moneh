import { apiFetch } from './apiClient';

export interface AppConfig {
	useActual: boolean;
	version: string;
}

export const configService = {
	async getConfig(): Promise<AppConfig> {
		try {
			return await apiFetch('/api/config');
		} catch (e) {
			console.warn('Failed to load gateway config, defaulting to standalone:', e);
			return { useActual: false, version: '1.0.0' };
		}
	}
};
