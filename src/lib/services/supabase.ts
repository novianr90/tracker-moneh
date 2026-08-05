import { createClient } from '@supabase/supabase-js';
import * as env from '$env/static/public';
import type { Database } from '$lib/types/database.types';
import ws from 'ws';

const supabaseUrl = (env as any).PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = (env as any).PUBLIC_SUPABASE_ANON_KEY || (env as any).PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

// Polyfill WebSocket for Node.js 20 SSR environment
if (typeof globalThis.WebSocket === 'undefined') {
	globalThis.WebSocket = ws as any;
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
	realtime: {
		transport: ws as any
	}
});
