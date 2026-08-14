export const authService = {
	async signIn(email: string, password: string) {
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});
		const data = await res.json();
		if (!res.ok) {
			throw new Error(data.error || 'Login failed');
		}
		return data;
	},

	async signOut() {
		const res = await fetch('/api/auth/logout', {
			method: 'POST'
		});
		return await res.json();
	},

	async getSession() {
		try {
			const res = await fetch('/api/auth/me');
			const data = await res.json();
			return data.session;
		} catch {
			return null;
		}
	},

	async getUser() {
		try {
			const res = await fetch('/api/auth/me');
			const data = await res.json();
			return data.user;
		} catch {
			return null;
		}
	}
};
