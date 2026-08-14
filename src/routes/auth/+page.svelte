<script lang="ts">
	import { authService } from '$lib/services/auth';
	import { goto, invalidateAll } from '$app/navigation';
	import { Wallet, LogIn, Loader2, Lock } from 'lucide-svelte';

	let email = '';
	let password = '';
	let loading = false;
	let errorMsg = '';

	async function handleLogin() {
		errorMsg = '';
		if (!email || !password) {
			errorMsg = 'Please enter both email and password';
			return;
		}

		loading = true;

		try {
			await authService.signIn(email, password);
			await invalidateAll();
			await goto('/');
		} catch (err: any) {
			errorMsg = err.message || 'AUTH001: Invalid email or password';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-[75vh] flex items-center justify-center py-12 px-4">
	<div class="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6">
		<div class="text-center space-y-2">
			<div class="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
				<Wallet class="w-8 h-8" />
			</div>
			<h1 class="text-2xl font-black text-foreground">Welcome Back</h1>
			<p class="text-xs text-muted-foreground">Sign in to your private personal expense tracker</p>
		</div>

		{#if errorMsg}
			<div class="p-3 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
				{errorMsg}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<div>
				<label for="auth-email" class="block text-xs font-medium text-muted-foreground mb-1">Email Address</label>
				<input
					id="auth-email"
					type="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					class="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
				/>
			</div>

			<div>
				<label for="auth-password" class="block text-xs font-medium text-muted-foreground mb-1">Password</label>
				<input
					id="auth-password"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					required
					class="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
			>
				{#if loading}
					<Loader2 class="w-5 h-5 animate-spin" />
					Signing In...
				{:else}
					<LogIn class="w-5 h-5" />
					Sign In
				{/if}
			</button>
		</form>

		<div class="pt-4 border-t border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
			<Lock class="w-3.5 h-3.5" />
			<span>Private 2-user instance (Public registration disabled)</span>
		</div>
	</div>
</div>
