import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/public';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const res = await fetch(`${GATEWAY_URL}/api/config`);
		if (res.ok) {
			const data = await res.json();
			return json(data);
		}
	} catch (e) {
		console.warn('Failed to proxy /api/config from gateway:', e);
	}
	return json({ useActual: false, version: '1.0.0' });
};
