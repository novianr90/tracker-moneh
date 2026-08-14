import * as env from '$env/static/public';

export const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
	const url = `${GATEWAY_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
	const res = await fetch(url, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...(options.headers || {})
		}
	});

	let data: any;
	const contentType = res.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		data = await res.json();
	} else {
		data = { message: await res.text() };
	}

	if (!res.ok) {
		throw new Error(data.error || data.message || `API Error (${res.status})`);
	}

	return data;
}
