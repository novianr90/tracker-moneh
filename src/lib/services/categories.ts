import { supabase } from './supabase';
import type { Database } from '$lib/types/database.types';

export type Category = Database['public']['Tables']['categories']['Row'];
export type InsertCategory = Database['public']['Tables']['categories']['Insert'];
export type UpdateCategory = Database['public']['Tables']['categories']['Update'];

export const categoryService = {
	async getCategories(): Promise<Category[]> {
		const { data, error } = await (supabase
			.from('categories') as any)
			.select('*')
			.order('name', { ascending: true });

		if (error) throw error;
		return data || [];
	},

	async createCategory(payload: Omit<InsertCategory, 'user_id'>): Promise<Category> {
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('AUTH002: User unauthenticated');

		const { data, error } = await (supabase
			.from('categories') as any)
			.insert({
				...payload,
				user_id: user.id
			})
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async updateCategory(id: string, payload: UpdateCategory): Promise<Category> {
		const { data, error } = await (supabase
			.from('categories') as any)
			.update(payload)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async deleteCategory(id: string): Promise<void> {
		const { error } = await (supabase
			.from('categories') as any)
			.delete()
			.eq('id', id);

		if (error) throw error;
	}
};
