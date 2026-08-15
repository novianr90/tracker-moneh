import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/public';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const token = cookies.get('sb-access-token');

	if (!token) {
		return json({ user: null, session: null });
	}

	try {
		const res = await fetch(`${GATEWAY_URL}/api/auth/me`, {
			headers: {
				Authorization: `Bearer ${token}`,
				cookie: `sb-access-token=${token}`
			}
		});

		if (!res.ok) {
			cookies.delete('sb-access-token', { path: '/' });
			cookies.delete('sb-refresh-token', { path: '/' });
			return json({ user: null, session: null });
		}

		const data = await res.json();
		return json(data);
	} catch (err) {
		return json({ user: null, session: null });
	}
};
