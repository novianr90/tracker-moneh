import * as env from '$env/static/public';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '$lib/types/database.types';

const supabaseUrl = (env as any).PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = (env as any).PUBLIC_SUPABASE_ANON_KEY || (env as any).PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder';

export const supabase = createBrowserClient<Database>(
	supabaseUrl,
	supabaseKey
);
