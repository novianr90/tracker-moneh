import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark';

/**
 * Read the theme app.html's blocking inline script already applied to <html>,
 * so the store's initial value matches the DOM from the very first render
 * instead of a hardcoded guess that flashes wrong until onMount.
 */
function getInitialTheme(): Theme {
	if (typeof document === 'undefined') return 'dark';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export const theme = writable<Theme>(getInitialTheme());

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
