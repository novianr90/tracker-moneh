/**
 * Format IDR currency amount
 */
export function formatIDR(amount: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Format date string to display format (e.g. 05 Aug 2026)
 */
export function formatDate(dateString: string): string {
	if (!dateString) return '';
	const date = new Date(dateString);
	return new Intl.DateTimeFormat('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	}).format(date);
}

/**
 * Get current date ISO string (YYYY-MM-DD)
 */
export function getTodayISODate(): string {
	return new Date().toISOString().split('T')[0];
}
