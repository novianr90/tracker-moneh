import { apiFetch } from './apiClient';
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

export interface DailyTrendPoint {
	expense_date: string;
	daily_total: number;
	cumulative_total: number;
}

export interface ExpenseFilters {
	startDate?: string;
	endDate?: string;
	categoryId?: string;
	paymentMethod?: string;
	searchKey?: string;
	page?: number;
	pageSize?: number;
}

export interface PaginatedExpenses {
	data: RecentExpenseView[];
	totalCount: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface ExpenseOperationResult {
	expense: Expense;
	statusCode?: number;
	cached?: boolean;
	message?: string;
}

export const expenseService = {
	async getExpenses(filters?: ExpenseFilters): Promise<PaginatedExpenses> {
		const params = new URLSearchParams();
		if (filters?.startDate) params.set('startDate', filters.startDate);
		if (filters?.endDate) params.set('endDate', filters.endDate);
		if (filters?.categoryId) params.set('categoryId', filters.categoryId);
		if (filters?.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
		if (filters?.searchKey) params.set('searchKey', filters.searchKey);
		if (filters?.page) params.set('page', filters.page.toString());
		if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString());

		const query = params.toString();
		return await apiFetch(`/api/expenses${query ? `?${query}` : ''}`);
	},

	async createExpense(payload: Omit<InsertExpense, 'user_id'>, idempotencyKey?: string): Promise<ExpenseOperationResult> {
		const key = idempotencyKey || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `moneh-${Date.now()}`);
		const res = await apiFetch('/api/expenses', {
			method: 'POST',
			headers: {
				'Idempotency-Key': key
			},
			body: JSON.stringify({
				...payload,
				idempotency_key: key
			})
		});

		if (res && res.expense) {
			return res;
		}
		return { expense: res, statusCode: 201 };
	},

	async retryExpense(id: string): Promise<ExpenseOperationResult> {
		return await apiFetch(`/api/expenses/${id}/retry`, {
			method: 'POST'
		});
	},

	async updateExpense(id: string, payload: UpdateExpense): Promise<Expense> {
		return await apiFetch(`/api/expenses/${id}`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		});
	},

	async deleteExpense(id: string): Promise<void> {
		await apiFetch(`/api/expenses/${id}`, {
			method: 'DELETE'
		});
	},

	async getMonthlySummary(month?: string): Promise<MonthlySummary> {
		const query = month ? `?month=${encodeURIComponent(month)}` : '';
		return await apiFetch(`/api/expenses/summary${query}`);
	},

	async getMonthlyCategoryBreakdown(month?: string): Promise<CategoryBreakdown[]> {
		const query = month ? `?month=${encodeURIComponent(month)}` : '';
		return await apiFetch(`/api/expenses/category-breakdown${query}`);
	},

	async getRecentTransactions(limit = 10): Promise<RecentExpenseView[]> {
		return await apiFetch(`/api/expenses/recent?limit=${limit}`);
	},

	async getDailyExpenseTrends(month?: string): Promise<DailyTrendPoint[]> {
		const query = month ? `?month=${encodeURIComponent(month)}` : '';
		return await apiFetch(`/api/expenses/trends${query}`);
	},

	async getPayees(): Promise<string[]> {
		return await apiFetch('/api/payees');
	}
};
