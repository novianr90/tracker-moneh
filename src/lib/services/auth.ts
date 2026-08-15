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
		try {
			await fetch('/api/auth/logout', {
				method: 'POST'
			});
		} catch (e) {
			console.error('Logout error:', e);
		}

		// Client-side document cookie clearance for extra safety
		if (typeof document !== 'undefined') {
			const cookies = document.cookie.split(';');
			for (let i = 0; i < cookies.length; i++) {
				const cookie = cookies[i];
				const eqPos = cookie.indexOf('=');
				const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
				document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.novianlabs.my.id;`;
			}
		}

		return { message: 'Signed out successfully' };
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
