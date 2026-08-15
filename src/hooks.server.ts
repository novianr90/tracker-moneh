import { type Handle, redirect } from '@sveltejs/kit';
import * as env from '$env/static/public';

const GATEWAY_URL = (env as any).PUBLIC_GATEWAY_URL || 'http://localhost:4000';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.safeGetSession = async () => {
		try {
			const token = event.cookies.get('sb-access-token');
			if (!token) {
				return { session: null, user: null };
			}

			const res = await event.fetch(`${GATEWAY_URL}/api/auth/me`, {
				headers: {
					Authorization: `Bearer ${token}`,
					cookie: `sb-access-token=${token}`
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

	// Route Guards: Allow /auth and /api/auth endpoints without redirect loop
	const isAuthRoute = event.url.pathname.startsWith('/auth') || event.url.pathname.startsWith('/api/auth');

	if (!user && !isAuthRoute) {
		throw redirect(303, '/auth');
	}

	if (user && event.url.pathname === '/auth') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
