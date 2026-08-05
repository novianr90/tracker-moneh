import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	const authHeader = req.headers.get('Authorization');
	if (!authHeader) {
		return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
	const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		global: { headers: { Authorization: authHeader } },
	});

	// Verify User
	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) {
		return new Response(JSON.stringify({ error: 'Unauthorized user session' }), {
			status: 401,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	// Create Sync Log Entry (in_progress)
	const { data: syncLog, error: logError } = await supabase
		.from('sync_logs')
		.insert({
			user_id: user.id,
			status: 'in_progress',
			started_at: new Date().toISOString()
		})
		.select()
		.single();

	if (logError) {
		console.error('Failed to create sync log:', logError);
	}

	try {
		// Fetch User Expenses
		const { data: expenses, error: expenseError } = await supabase
			.from('recent_expenses')
			.select('*')
			.eq('user_id', user.id);

		if (expenseError) throw expenseError;

		const count = expenses?.length || 0;

		// Simulated Google Sheets API Sync execution
		// In production environment:
		// 1. Authenticate with GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY
		// 2. Fetch target sheet range using GOOGLE_SPREADSHEET_ID
		// 3. Reconcile rows using expense.id
		// 4. Mark deleted items with [DELETED] prefix & strikethrough format

		const finishedAt = new Date().toISOString();

		if (syncLog) {
			await supabase
				.from('sync_logs')
				.update({
					status: 'success',
					synced_count: count,
					finished_at: finishedAt
				})
				.eq('id', syncLog.id);
		}

		return new Response(
			JSON.stringify({
				status: 'success',
				syncedCount: count,
				finishedAt
			}),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				status: 200,
			}
		);
	} catch (err: any) {
		console.error('Sync execution failed:', err);

		if (syncLog) {
			await supabase
				.from('sync_logs')
				.update({
					status: 'failed',
					error_message: err.message || 'Unknown execution failure',
					finished_at: new Date().toISOString()
				})
				.eq('id', syncLog.id);
		}

		return new Response(
			JSON.stringify({ error: err.message || 'Sync execution failed' }),
			{
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
				status: 500,
			}
		);
	}
});
