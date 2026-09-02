<script lang="ts">
	import { authService } from '$lib/services/auth';
	import { currentUser } from '$lib/stores/auth';
	import { goto, invalidateAll } from '$app/navigation';
	import { Wallet, Lock, Eye, EyeOff } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let email = '';
	let password = '';
	let showPassword = false;
	let loading = false;
	let errorMsg = '';
	let emailInvalid = false;
	let passwordInvalid = false;

	/**
	 * Svelte 4 disallows a dynamic `type` on an <input> that also uses bind:value,
	 * so the password field's type is set imperatively via this action instead of
	 * swapping two separate <input> elements (which would drop focus/selection).
	 */
	function inputType(node: HTMLInputElement, type: string) {
		node.type = type;
		return {
			update(type: string) {
				node.type = type;
			}
		};
	}

	async function handleLogin() {
		errorMsg = '';
		emailInvalid = !email;
		passwordInvalid = !password;
		if (emailInvalid || passwordInvalid) {
			errorMsg = 'Please enter both email and password';
			return;
		}

		loading = true;

		try {
			const data = await authService.signIn(email, password);
			if (data.user) {
				currentUser.set(data.user);
			}
			await invalidateAll();
			await goto('/');
		} catch (err: any) {
			errorMsg = err.message || 'AUTH001: Invalid email or password';
			emailInvalid = true;
			passwordInvalid = true;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-[75vh] flex items-center justify-center py-12 px-4">
	<Card class="w-full max-w-md p-8 space-y-6">
		<div class="text-center space-y-2">
			<Wallet class="w-7 h-7 text-primary mx-auto mb-1" aria-hidden="true" />
			<h1 class="text-2xl font-heading font-semibold text-foreground">Welcome Back</h1>
			<p class="text-xs text-muted-foreground">Sign in to your private personal expense tracker</p>
		</div>

		{#if errorMsg}
			<div role="alert" class="p-3 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
				{errorMsg}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4" novalidate>
			<div>
				<label for="auth-email" class="block text-xs font-medium text-muted-foreground mb-1">Email Address</label>
				<input
					id="auth-email"
					type="email"
					autocomplete="email"
					bind:value={email}
					placeholder="you@example.com"
					required
					aria-invalid={emailInvalid}
					class="w-full px-3 py-2.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
				/>
			</div>

			<div>
				<label for="auth-password" class="block text-xs font-medium text-muted-foreground mb-1">Password</label>
				<div class="relative">
					<input
						id="auth-password"
						type="password"
						use:inputType={showPassword ? 'text' : 'password'}
						autocomplete="current-password"
						bind:value={password}
						placeholder="••••••••"
						required
						aria-invalid={passwordInvalid}
						class="w-full px-3 py-2.5 pr-10 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
					/>
					<button
						type="button"
						on:click={() => (showPassword = !showPassword)}
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
					>
						{#if showPassword}
							<EyeOff class="w-4 h-4" aria-hidden="true" />
						{:else}
							<Eye class="w-4 h-4" aria-hidden="true" />
						{/if}
					</button>
				</div>
			</div>

			<Button type="submit" variant="primary" size="md" {loading} class="w-full font-bold">
				<Lock slot="icon" class="w-4 h-4" aria-hidden="true" />
				{loading ? 'Signing In...' : 'Sign In'}
			</Button>
		</form>
	</Card>
</div>
