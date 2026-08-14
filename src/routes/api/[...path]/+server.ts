import { json, type RequestHandler } from '@sveltejs/kit';
import * as env from '$env/static/public';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

const proxyRequest = async ({ request, cookies, params, fetch }: any) => {
	const path = params.path;
	
	// Check if this route is being handled by a more specific SvelteKit route
	// like /api/auth/login or /api/config
	if (path === 'auth/login' || path === 'auth/logout' || path === 'config') {
		return json({ error: 'Should not reach catch-all' }, { status: 404 });
	}
	
	// Reconstruct the URL for the gateway
	const url = new URL(request.url);
	const targetUrl = `${GATEWAY_URL}/api/${path}${url.search}`;

	// Get the token from cookies
	const token = cookies.get('sb-access-token');

	// Construct headers
	const headers = new Headers(request.headers);
	
	// Remove headers that might cause issues with the proxy
	headers.delete('host');
	headers.delete('origin');
	headers.delete('referer');
	headers.delete('cookie'); // We'll send the token in the Authorization header instead

	if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	}

	// Prepare fetch options
	const options: RequestInit = {
		method: request.method,
		headers,
		redirect: 'manual'
	};

	// Only attach body for non-GET/HEAD requests
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		const bodyText = await request.text();
		if (bodyText) {
			options.body = bodyText;
		}
	}

	try {
		const res = await fetch(targetUrl, options);
		
		// If it's a JSON response, return it using json() to ensure proper Content-Type
		const contentType = res.headers.get('content-type');
		if (contentType && contentType.includes('application/json')) {
			const data = await res.json();
			return json(data, { status: res.status });
		}

		// For other types, return the raw response
		return new Response(res.body, {
			status: res.status,
			headers: {
				'Content-Type': contentType || 'text/plain'
			}
		});
	} catch (e: any) {
		console.error(`Proxy error for /api/${path}:`, e);
		return json({ error: 'Gateway proxy failed', details: e.message }, { status: 500 });
	}
};

export const GET: RequestHandler = proxyRequest;
export const POST: RequestHandler = proxyRequest;
export const PUT: RequestHandler = proxyRequest;
export const PATCH: RequestHandler = proxyRequest;
export const DELETE: RequestHandler = proxyRequest;
