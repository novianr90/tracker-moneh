import { supabase } from './supabase';
import type { Database } from '$lib/types/database.types';

export type PaymentMethodItem = Database['public']['Tables']['payment_methods']['Row'];
export type InsertPaymentMethodItem = Database['public']['Tables']['payment_methods']['Insert'];

const DEFAULT_PAYMENT_METHODS = ['Cash', 'QRIS', 'Credit Card', 'GoPay/OVO', 'Bank Transfer'];

export const paymentMethodService = {
	async getPaymentMethods(): Promise<PaymentMethodItem[]> {
		try {
			const { data, error } = await (supabase
				.from('payment_methods') as any)
				.select('*')
				.order('created_at', { ascending: true });

			if (error) throw error;
			if (data && data.length > 0) {
				return data;
			}
		} catch (e: any) {
			console.warn('Could not fetch payment_methods table, using defaults:', e?.message);
		}

		// Fallback mock items if DB empty or uninitialized
		return DEFAULT_PAYMENT_METHODS.map((name, index) => ({
			id: `default-${index}`,
			user_id: 'default',
			name,
			created_at: new Date().toISOString()
		}));
	},

	async createPaymentMethod(name: string): Promise<PaymentMethodItem> {
		const trimmedName = name.trim();
		if (!trimmedName) {
			throw new Error('PM001: Payment method name cannot be empty');
		}

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error('AUTH002: User unauthenticated');

		const { data, error } = await (supabase
			.from('payment_methods') as any)
			.insert({
				name: trimmedName,
				user_id: user.id
			})
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async deletePaymentMethod(id: string): Promise<void> {
		if (id.startsWith('default-')) {
			throw new Error('Default payment methods cannot be deleted directly');
		}

		const { error } = await (supabase
			.from('payment_methods') as any)
			.delete()
			.eq('id', id);

		if (error) throw error;
	}
};
