<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { authService } from '$lib/services/auth';
	import { currentUser, checkAuth } from '$lib/stores/auth';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { Wallet, LayoutDashboard, Receipt, Tag, CreditCard, RefreshCw, LogOut, LogIn, Settings, Sun, Moon } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { theme, initTheme, toggleTheme } from '$lib/stores/theme';

	export let data;

	$: user = $currentUser || data.user;

	onMount(async () => {
		initTheme();
		if (data.user) {
			currentUser.set(data.user);
		} else {
			await checkAuth();
		}
	});

	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 5,
				refetchOnWindowFocus: false
			}
		}
	});

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/expenses', label: 'Expenses', icon: Receipt },
		{ href: '/categories', label: 'Categories', icon: Tag },
		{ href: '/payment-methods', label: 'Payment Methods', icon: CreditCard },
		{ href: '/sync', label: 'Sync & Logs', icon: RefreshCw },
		{ href: '/settings', label: 'Settings', icon: Settings }
	];

	async function handleSignOut() {
		try {
			await authService.signOut();
			currentUser.set(null);
			data.user = null;
			data.session = null;
			window.location.href = '/auth';
		} catch (e) {
			console.error('Sign out error:', e);
			currentUser.set(null);
			data.user = null;
			data.session = null;
			window.location.href = '/auth';
		}
	}
</script>

<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-background text-foreground flex flex-col">
		<!-- Top Header -->
		<header class="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
			<div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
				<a href="/" class="flex items-center gap-2.5 font-heading font-semibold text-xl text-foreground shrink-0">
					<div class="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
						<Wallet class="w-5 h-5" aria-hidden="true" />
					</div>
					<span class="hidden sm:inline">Tracker<span class="text-primary">Moneh</span></span>
				</a>

				<!-- Desktop Navigation -->
				{#if user}
					<nav class="hidden md:flex items-center gap-0.5 xl:gap-1 min-w-0 overflow-x-auto no-scrollbar">
						{#each navItems as item}
							{@const active = $page.url.pathname === item.href}
							<a
								href={item.href}
								title={item.label}
								aria-label={item.label}
								aria-current={active ? 'page' : undefined}
								class="px-2 xl:px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 {active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}"
							>
								<svelte:component this={item.icon} class="w-4 h-4 shrink-0" aria-hidden="true" />
								<span class="hidden xl:inline">{item.label}</span>
							</a>
						{/each}
					</nav>
				{/if}

				<div class="flex items-center gap-2 shrink-0">
					<button
						on:click={toggleTheme}
						aria-label={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
						class="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						{#if $theme === 'dark'}
							<Sun class="w-4 h-4" aria-hidden="true" />
						{:else}
							<Moon class="w-4 h-4" aria-hidden="true" />
						{/if}
					</button>

					{#if user}
						<Button variant="secondary" size="sm" on:click={handleSignOut} class="hover:bg-destructive/20 hover:text-destructive-foreground">
							<LogOut slot="icon" class="w-3.5 h-3.5" aria-hidden="true" />
							<span class="hidden sm:inline">Sign Out ({user.email?.split('@')[0]})</span>
							<span class="sm:hidden">Sign Out</span>
						</Button>
					{:else}
						<a
							href="/auth"
							class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						>
							<LogIn class="w-3.5 h-3.5" aria-hidden="true" />
							Sign In
						</a>
					{/if}
				</div>
			</div>
		</header>

		<!-- Main Content Area -->
		<main class="flex-1 max-w-6xl w-full mx-auto px-4 py-6 {user ? 'pb-24 md:pb-6' : ''}">
			<slot />
		</main>

		<!-- Mobile Bottom Navigation Bar -->
		{#if user}
			<nav class="md:hidden border-t border-border bg-card sticky bottom-0 z-40 px-1 py-1.5 flex items-center justify-around" style="padding-bottom: max(0.375rem, env(safe-area-inset-bottom));">
				{#each navItems as item}
					{@const active = $page.url.pathname === item.href}
					<a
						href={item.href}
						aria-current={active ? 'page' : undefined}
						class="flex flex-col items-center gap-1 py-1.5 px-2 min-w-[3rem] rounded-lg text-[10px] font-medium transition-colors {active ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground hover:text-foreground'}"
					>
						<svelte:component this={item.icon} class="w-5 h-5" aria-hidden="true" />
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>
</QueryClientProvider>
