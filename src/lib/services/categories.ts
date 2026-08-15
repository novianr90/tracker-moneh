import { apiFetch } from './apiClient';
import type { Database } from '$lib/types/database.types';

export type Category = Database['public']['Tables']['categories']['Row'];
export type InsertCategory = Database['public']['Tables']['categories']['Insert'];
export type UpdateCategory = Database['public']['Tables']['categories']['Update'];

export const categoryService = {
	async getCategories(onlyActive = false): Promise<Category[]> {
		const query = onlyActive ? '?active_only=true' : '';
		return await apiFetch(`/api/categories${query}`);
	},

	async createCategory(payload: Omit<InsertCategory, 'user_id'>): Promise<Category> {
		return await apiFetch('/api/categories', {
			method: 'POST',
			body: JSON.stringify(payload)
		});
	},

	async updateCategory(id: string, payload: UpdateCategory): Promise<Category> {
		return await apiFetch(`/api/categories/${id}`, {
			method: 'PUT',
			body: JSON.stringify(payload)
		});
	},

	async deleteCategory(id: string): Promise<void> {
		await apiFetch(`/api/categories/${id}`, {
			method: 'DELETE'
		});
	}
};
