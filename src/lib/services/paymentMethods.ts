import { apiFetch } from './apiClient';
import type { Database } from '$lib/types/database.types';

export type PaymentMethodItem = Database['public']['Tables']['payment_methods']['Row'];
export type InsertPaymentMethodItem = Database['public']['Tables']['payment_methods']['Insert'];

export const paymentMethodService = {
	async getPaymentMethods(onlyActive = false): Promise<PaymentMethodItem[]> {
		const query = onlyActive ? '?active_only=true' : '';
		return await apiFetch(`/api/payment-methods${query}`);
	},

	async createPaymentMethod(name: string): Promise<PaymentMethodItem> {
		return await apiFetch('/api/payment-methods', {
			method: 'POST',
			body: JSON.stringify({ name })
		});
	},

	async deletePaymentMethod(id: string): Promise<void> {
		await apiFetch(`/api/payment-methods/${id}`, {
			method: 'DELETE'
		});
	}
};
