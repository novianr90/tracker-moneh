import * as env from '$env/static/public';

const SUPABASE_URL = (env as any).PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
export const REST_SUPABASE_API = SUPABASE_URL + "/rest/v1/"
