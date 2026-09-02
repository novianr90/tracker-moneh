import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

export const theme = writable<Theme>('dark');

/** Sync the store with whatever class app.html's blocking init script already applied. */
export function initTheme() {
	if (typeof document === 'undefined') return;
	theme.set(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
}

export function toggleTheme() {
	if (typeof document === 'undefined') return;
	const next = document.documentElement.classList.toggle('dark') ? 'dark' : 'light';
	theme.set(next);
	try {
		localStorage.setItem('theme', next);
	} catch {
		// ignore (private browsing / storage disabled)
	}
}
