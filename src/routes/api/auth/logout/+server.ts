import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/public';
import { dev } from '$app/environment';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const POST: RequestHandler = async ({ cookies, fetch, url }) => {
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

	// Extract root domain (e.g. .novianlabs.my.id from tracker-dev.novianlabs.my.id)
	const hostParts = url.hostname.split('.');
	const rootDomain = hostParts.length >= 2 ? `.${hostParts.slice(-3).join('.')}` : undefined;

	const cookieNames = ['sb-access-token', 'sb-refresh-token', 'access_token', 'refresh_token'];
	const domainList = [undefined, rootDomain, '.novianlabs.my.id', url.hostname];

	for (const name of cookieNames) {
		for (const domain of domainList) {
			cookies.delete(name, {
				path: '/',
				domain: domain || undefined,
				secure: !dev,
				sameSite: 'lax'
			});
			cookies.delete(name, {
				path: '/',
				domain: domain || undefined
			});
		}
	}

	return json({ message: 'Signed out successfully' });
};
