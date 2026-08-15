export interface AppConfig {
	useActual: boolean;
	version: string;
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
		return { useActual: false, version: '1.0.0' };
	}
};
