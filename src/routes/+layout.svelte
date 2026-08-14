<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { authService } from '$lib/services/auth';
	import { currentUser, checkAuth } from '$lib/stores/auth';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { Wallet, LayoutDashboard, Receipt, Tag, CreditCard, RefreshCw, LogOut, LogIn } from 'lucide-svelte';

	export let data;

	$: user = $currentUser || data.user;

	onMount(async () => {
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
		{ href: '/sync', label: 'Sync & Logs', icon: RefreshCw }
	];

	async function handleSignOut() {
		try {
			await authService.signOut();
			currentUser.set(null);
			await invalidateAll();
			goto('/auth');
		} catch (e) {
			console.error('Sign out error:', e);
		}
	}
</script>

<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-background text-foreground flex flex-col">
		<!-- Top Header -->
		<header class="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
			<div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
				<a href="/" class="flex items-center gap-2.5 font-black text-xl text-foreground">
					<div class="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
						<Wallet class="w-5 h-5" />
					</div>
					<span>Tracker<span class="text-primary">Moneh</span></span>
				</a>

				<!-- Desktop Navigation -->
				{#if user}
					<nav class="hidden md:flex items-center gap-1">
						{#each navItems as item}
							{@const active = $page.url.pathname === item.href}
							<a
								href={item.href}
								class="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 {active ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}"
							>
								<svelte:component this={item.icon} class="w-4 h-4" />
								{item.label}
							</a>
						{/each}
					</nav>
				{/if}

				<div class="flex items-center gap-3">
					{#if user}
						<button
							on:click={handleSignOut}
							class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-destructive/20 hover:text-destructive-foreground text-foreground flex items-center gap-1.5 transition-colors"
						>
							<LogOut class="w-3.5 h-3.5" />
							Sign Out ({user.email?.split('@')[0]})
						</button>
					{:else}
						<a
							href="/auth"
							class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground flex items-center gap-1.5 transition-colors"
						>
							<LogIn class="w-3.5 h-3.5" />
							Sign In
						</a>
					{/if}
				</div>
			</div>
		</header>

		<!-- Main Content Area -->
		<main class="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
			<slot />
		</main>

		<!-- Mobile Bottom Navigation Bar -->
		{#if user}
			<nav class="md:hidden border-t border-border bg-card sticky bottom-0 z-40 px-2 py-2 flex items-center justify-around">
				{#each navItems as item}
					{@const active = $page.url.pathname === item.href}
					<a
						href={item.href}
						class="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-colors {active ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}"
					>
						<svelte:component this={item.icon} class="w-5 h-5" />
						{item.label}
					</a>
				{/each}
			</nav>
		{/if}
	</div>
</QueryClientProvider>
