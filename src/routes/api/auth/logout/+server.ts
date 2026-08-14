import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/public';
import { dev } from '$app/environment';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
	const token = cookies.get('sb-access-token');

	try {
		await fetch(`${GATEWAY_URL}/api/auth/logout`, {
			method: 'POST',
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {})
			}
		});
	} catch (e) {
		// Ignore error on gateway logout if network fails
	}

	cookies.delete('sb-access-token', {
		path: '/',
		secure: !dev,
		sameSite: 'lax'
	});
	cookies.delete('sb-refresh-token', {
		path: '/',
		secure: !dev,
		sameSite: 'lax'
	});

	// Failsafe deletion without options
	cookies.delete('sb-access-token', { path: '/' });
	cookies.delete('sb-refresh-token', { path: '/' });

	return json({ message: 'Signed out successfully' });
};
