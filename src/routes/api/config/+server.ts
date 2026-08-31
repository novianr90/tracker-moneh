import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/public';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const GET: RequestHandler = async ({ fetch, cookies }) => {
	// Gateway's /api/config is authenticated (returns this user's actualSyncId too) -
	// forward the token like the catch-all proxy does. Anonymous/failed calls still
	// degrade gracefully to the useActual-only shape below.
	const token = cookies.get('sb-access-token');
	const headers: Record<string, string> = {};
	if (token) headers.Authorization = `Bearer ${token}`;

	try {
		const res = await fetch(`${GATEWAY_URL}/api/config`, { headers });
		if (res.ok) {
			const data = await res.json();
			return json(data);
		}
	} catch (e) {
		console.warn('Failed to proxy /api/config from gateway:', e);
	}
	return json({ useActual: false, actualSyncId: null, version: '1.0.0' });
};
