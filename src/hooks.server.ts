import { createServerClient } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import * as env from '$env/static/public';
import ws from 'ws';

// Polyfill WebSocket for Node.js 20 SSR environment
if (typeof globalThis.WebSocket === 'undefined') {
	globalThis.WebSocket = ws as any;
}

const supabaseUrl = (env as any).PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = (env as any).PUBLIC_SUPABASE_ANON_KEY || (env as any).PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		supabaseUrl,
		supabaseKey,
		{
			cookies: {
				getAll() {
					return event.cookies.getAll();
				},
				setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
					cookiesToSet.forEach(({ name, value, options }) =>
						event.cookies.set(name, value, { ...options, path: '/' })
					);
				}
			},
			realtime: {
				transport: ws as any
			}
		}
	) as any;

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) {
			return { session: null, user: null };
		}

		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Mandatory Route Guard: Redirect all unauthenticated requests to /auth
	if (!user && !event.url.pathname.startsWith('/auth')) {
		throw redirect(303, '/auth');
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
