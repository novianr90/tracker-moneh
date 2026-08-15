import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/public';
import { dev } from '$app/environment';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	try {
		const body = await request.json();
		const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		const data = await res.json();

		if (!res.ok) {
			return json({ error: data.error || 'Invalid credentials' }, { status: res.status });
		}

		if (data.session?.access_token) {
			cookies.set('sb-access-token', data.session.access_token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !dev,
				maxAge: data.session.expires_in || 60 * 60 * 24 * 7
			});
		}

		if (data.session?.refresh_token) {
			cookies.set('sb-refresh-token', data.session.refresh_token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !dev,
				maxAge: 60 * 60 * 24 * 30
			});
		}

		return json(data);
	} catch (err: any) {
		return json({ error: err.message || 'Login failed' }, { status: 500 });
	}
};
