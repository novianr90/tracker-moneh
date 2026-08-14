import { type Handle, redirect } from '@sveltejs/kit';
import * as env from '$env/static/public';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.safeGetSession = async () => {
		try {
			const cookieHeader = event.request.headers.get('cookie') || '';
			const res = await event.fetch(`${GATEWAY_URL}/api/auth/me`, {
				headers: {
					cookie: cookieHeader
				}
			});
			if (res.ok) {
				const data = await res.json();
				return { session: data.session, user: data.user };
			}
		} catch (e) {
			console.error('Failed to authenticate via gateway:', e);
		}
		return { session: null, user: null };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Mandatory Route Guard: Redirect all unauthenticated requests to /auth
	if (!user && !event.url.pathname.startsWith('/auth')) {
		throw redirect(303, '/auth');
	}

	if (user && event.url.pathname.startsWith('/auth')) {
		throw redirect(303, '/');
	}

	return resolve(event);
};
