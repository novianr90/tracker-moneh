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
	const supabaseAnonKey = Deno.env.get('PUBLIC_SUPABASE_PUBLISHABLE_KEY') || '';
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

		const googleScriptUrl = Deno.env.get('GOOGLE_SCRIPT_URL');
		const spreadsheetApiKey = Deno.env.get('SPREADSHEET_API_KEY');

		let syncDetails = { syncedCount: count };

		// Call Google Apps Script Web App if secrets are configured
		if (googleScriptUrl && spreadsheetApiKey) {
			const gasResponse = await fetch(googleScriptUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					apiKey: spreadsheetApiKey,
					action: 'syncExpenses',
					data: (expenses || []).map((exp: any) => ({
						...exp,
						user_email: user.email
					}))
				}),
				redirect: 'follow'
			});

			const gasResult = await gasResponse.json();

			if (!gasResponse.ok || gasResult.status === 'error') {
				throw new Error(gasResult.message || `Google Apps Script returned status ${gasResponse.status}`);
			}

			syncDetails = { ...syncDetails, ...gasResult };
		} else {
			console.warn('GOOGLE_SCRIPT_URL or SPREADSHEET_API_KEY missing. Execution logged in dry-run mode.');
		}

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
				finishedAt,
				details: syncDetails
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
