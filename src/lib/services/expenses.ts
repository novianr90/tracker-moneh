import { supabase } from './supabase';
import type { Database } from '$lib/types/database.types';

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type InsertExpense = Database['public']['Tables']['expenses']['Insert'];
export type UpdateExpense = Database['public']['Tables']['expenses']['Update'];
export type RecentExpenseView = Database['public']['Views']['recent_expenses']['Row'];

export interface MonthlySummary {
	total_amount: number;
	transaction_count: number;
	prev_month_total: number;
}

export interface CategoryBreakdown {
	category_id: string;
	category_name: string;
	color: string;
	icon: string;
	total_amount: number;
}

export interface ExpenseFilters {
	startDate?: string;
	endDate?: string;
	categoryId?: string;
	paymentMethod?: string;
	searchKey?: string;
}

export const expenseService = {
	async getExpenses(filters?: ExpenseFilters): Promise<RecentExpenseView[]> {
		let query = (supabase
			.from('recent_expenses') as any)
			.select('*')
			.order('expense_date', { ascending: false });

		if (filters?.startDate) {
			query = query.gte('expense_date', filters.startDate);
		}
		if (filters?.endDate) {
			query = query.lte('expense_date', filters.endDate);
		}
		if (filters?.categoryId) {
			query = query.eq('category_name', filters.categoryId);
		}
		if (filters?.paymentMethod) {
			query = query.eq('payment_method', filters.paymentMethod);
		}
		if (filters?.searchKey) {
			query = query.ilike('description', `%${filters.searchKey}%`);
		}

		const { data, error } = await query;
		if (error) throw error;
		return data || [];
	},

	async createExpense(payload: Omit<InsertExpense, 'user_id'>): Promise<Expense> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('AUTH002: User unauthenticated');

		if (payload.amount <= 0) {
			throw new Error('EXP002: Expense amount must be greater than 0');
		}

		const { data, error } = await (supabase
			.from('expenses') as any)
			.insert({
				...payload,
				user_id: user.id
			})
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async updateExpense(id: string, payload: UpdateExpense): Promise<Expense> {
		if (payload.amount !== undefined && payload.amount <= 0) {
			throw new Error('EXP002: Expense amount must be greater than 0');
		}

		const { data, error } = await (supabase
			.from('expenses') as any)
			.update(payload)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async deleteExpense(id: string): Promise<void> {
		const { error } = await (supabase
			.from('expenses') as any)
			.delete()
			.eq('id', id);

		if (error) throw error;
	},

	async getMonthlySummary(month?: string): Promise<MonthlySummary> {
		const { data, error } = await (supabase as any).rpc('get_monthly_summary', {
			p_month: month
		});

		if (error) throw error;
		if (data && data.length > 0) {
			return {
				total_amount: Number(data[0].total_amount),
				transaction_count: Number(data[0].transaction_count),
				prev_month_total: Number(data[0].prev_month_total)
			};
		}
		return { total_amount: 0, transaction_count: 0, prev_month_total: 0 };
	},

	async getMonthlyCategoryBreakdown(month?: string): Promise<CategoryBreakdown[]> {
		const { data, error } = await (supabase as any).rpc('get_monthly_category_breakdown', {
			p_month: month
		});

		if (error) throw error;
		return (data || []).map((row: any) => ({
			...row,
			total_amount: Number(row.total_amount)
		}));
	},

	async getRecentTransactions(limit = 10): Promise<RecentExpenseView[]> {
		const { data, error } = await (supabase as any).rpc('get_recent_transactions', {
			p_limit: limit
		});

		if (error) throw error;
		return data || [];
	}
};
