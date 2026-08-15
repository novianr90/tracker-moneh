import { writable } from 'svelte/store';
import { authService } from '$lib/services/auth';

export const currentUser = writable<any>(null);

export async function checkAuth() {
	try {
		const user = await authService.getUser();
		currentUser.set(user);
		return user;
	} catch {
		currentUser.set(null);
		return null;
	}
}
