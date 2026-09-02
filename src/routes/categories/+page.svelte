<script lang="ts">
	import { onMount } from 'svelte';
	import { categoryService, type Category } from '$lib/services/categories';
	import { configService } from '$lib/services/config';
	import { Tag, Plus, Trash2, Palette, Info } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let categories: Category[] = [];
	let loading = true;
	let creating = false;
	let useActual = false;

	let newName = '';
	let newColor = '#10b981';
	let newIcon = 'tag';
	let errorMsg = '';

	const presetColors = [
		'#ef4444', '#f97316', '#f59e0b', '#10b981', '#14b8a6',
		'#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
		'#ec4899', '#f43f5e', '#64748b', '#78716c'
	];

	async function loadCategories() {
		loading = true;

		configService.getConfig().then(cfg => {
			useActual = cfg.useActual;
		}).catch(console.error);

		try {
			categories = await categoryService.getCategories();
		} catch (err: any) {
			console.error('Failed loading categories:', err);
		} finally {
			loading = false;
		}
	}

	async function handleCreateCategory() {
		errorMsg = '';
		if (!newName.trim()) {
			errorMsg = 'Please enter category name';
			return;
		}

		creating = true;

		try {
			await categoryService.createCategory({
				name: newName.trim(),
				color: newColor,
				icon: newIcon
			});

			newName = '';
			await loadCategories();
		} catch (err: any) {
			errorMsg = err.message || 'Failed to create category';
		} finally {
			creating = false;
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this category?')) return;
		try {
			await categoryService.deleteCategory(id);
			await loadCategories();
		} catch (err: any) {
			alert('Failed to delete category: ' + err.message);
		}
	}

	onMount(() => {
		loadCategories();
	});
</script>

<div class="space-y-6">
	<PageHeader icon={Tag} title="Master Categories" description="Manage custom categories, color tags, and icons" />

	<!-- Info Notice if USE_ACTUAL=true -->
	{#if useActual}
		<div class="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
			<Info class="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
			<div class="text-xs space-y-1">
				<p class="font-bold text-foreground">Master Data Dikelola oleh Actual Budget</p>
				<p class="text-muted-foreground">
					Kategori disinkronkan secara otomatis dari Actual Budget (<code class="bg-card px-1 rounded">USE_ACTUAL=true</code>). Untuk menambah atau mengubah kategori, kelola di Actual Budget lalu klik <a href="/sync" class="text-primary font-semibold hover:underline">Sync Master Data</a> di menu Sync.
				</p>
			</div>
		</div>
	{/if}

	<!-- Create Category Form (Only visible when USE_ACTUAL=false) -->
	{#if !useActual}
		<Card class="space-y-4">
			<h2 class="text-sm font-heading font-semibold text-foreground flex items-center gap-2">
				<Plus class="w-4 h-4 text-primary" aria-hidden="true" /> Add New Category
			</h2>

			{#if errorMsg}
				<div role="alert" class="p-2.5 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
					{errorMsg}
				</div>
			{/if}

			<form on:submit|preventDefault={handleCreateCategory} class="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div>
					<label for="category-name-input" class="block text-xs font-medium text-muted-foreground mb-1">Category Name</label>
					<input
						id="category-name-input"
						type="text"
						placeholder="e.g. Healthcare, Subscriptions"
						bind:value={newName}
						required
						aria-invalid={!!errorMsg}
						class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>

				<div>
					<span class="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
						<Palette class="w-3.5 h-3.5" aria-hidden="true" /> Color Tag
					</span>
					<div class="flex items-center gap-1.5 pt-1 flex-wrap">
						{#each presetColors as color}
							<button
								type="button"
								on:click={() => (newColor = color)}
								aria-label={`Use color ${color}`}
								aria-pressed={newColor === color}
								class="w-6 h-6 rounded-full transition-transform {newColor === color ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-110'}"
								style="background-color: {color};"
							></button>
						{/each}
						<label title="Custom Color" class="relative cursor-pointer w-6 h-6 rounded-full border border-border flex items-center justify-center overflow-hidden hover:scale-110 transition-transform">
							<input
								type="color"
								bind:value={newColor}
								aria-label="Custom color picker"
								class="absolute -top-2 -left-2 w-8 h-8 cursor-pointer opacity-0"
							/>
							<span class="w-full h-full rounded-full" style="background-color: {newColor};"></span>
						</label>
					</div>
				</div>

				<div class="flex items-end">
					<Button type="submit" variant="primary" size="md" loading={creating} class="w-full">
						<Plus slot="icon" class="w-4 h-4" aria-hidden="true" />
						{creating ? 'Creating...' : 'Save Category'}
					</Button>
				</div>
			</form>
		</Card>
	{/if}

	<!-- Categories Grid -->
	<Card class="space-y-4">
		<h2 class="text-sm font-heading font-semibold text-foreground">Active Categories ({categories.length})</h2>

		{#if loading}
			<div class="text-center py-6 text-xs text-muted-foreground">Loading master categories...</div>
		{:else if categories.length === 0}
			<EmptyState icon={Tag} message="No categories found." hint="Create one above to get started." />
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{#each categories as cat}
					<div class="p-3 bg-secondary/40 border border-border rounded-lg flex items-center justify-between gap-2">
						<div class="flex items-center gap-2.5 min-w-0">
							<span class="w-4 h-4 rounded-full shrink-0" style="background-color: {cat.color || '#6b7280'};" aria-hidden="true"></span>
							<span class="text-xs font-semibold truncate {cat.is_active === false ? 'line-through text-muted-foreground' : 'text-foreground'}">{cat.name}</span>
							{#if cat.is_active === false}
								<Badge variant="neutral">Inactive</Badge>
							{/if}
						</div>
						{#if !useActual}
							<button
								on:click={() => handleDelete(cat.id)}
								aria-label={`Delete category ${cat.name}`}
								class="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
							>
								<Trash2 class="w-4 h-4" aria-hidden="true" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</Card>
</div>
