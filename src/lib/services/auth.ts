import { apiFetch } from './apiClient';

export const authService = {
	async signIn(email: string, password: string) {
		return await apiFetch('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		});
	},

	async signOut() {
		return await apiFetch('/api/auth/logout', {
			method: 'POST'
		});
	},

	async getSession() {
		const res = await apiFetch('/api/auth/me');
		return res.session;
	},

	async getUser() {
		const res = await apiFetch('/api/auth/me');
		return res.user;
	}
};
