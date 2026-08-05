<script lang="ts">
	import { onMount } from 'svelte';
	import { categoryService, type Category } from '$lib/services/categories';
	import { Tag, Plus, Trash2, Loader2, Palette } from 'lucide-svelte';

	let categories: Category[] = [];
	let loading = true;
	let creating = false;

	let newName = '';
	let newColor = '#10b981';
	let newIcon = 'tag';
	let errorMsg = '';

	const presetColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

	async function loadCategories() {
		loading = true;
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
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-black text-foreground flex items-center gap-2">
			<Tag class="w-6 h-6 text-primary" />
			Master Categories
		</h1>
		<p class="text-xs text-muted-foreground">Manage custom categories, color tags, and icons</p>
	</div>

	<!-- Create Category Form -->
	<div class="p-5 bg-card border border-border rounded-xl shadow-sm space-y-4">
		<h2 class="text-sm font-bold text-foreground flex items-center gap-2">
			<Plus class="w-4 h-4 text-primary" /> Add New Category
		</h2>

		{#if errorMsg}
			<div class="p-2.5 text-xs bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-lg">
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
					class="w-full px-3 py-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>

			<div>
				<span class="block text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
					<Palette class="w-3.5 h-3.5" /> Color Tag
				</span>
				<div class="flex items-center gap-1.5 pt-1">
					{#each presetColors as color}
						<button
							type="button"
							on:click={() => (newColor = color)}
							class="w-6 h-6 rounded-full transition-transform {newColor === color ? 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-110'}"
							style="background-color: {color};"
						></button>
					{/each}
				</div>
			</div>

			<div class="flex items-end">
				<button
					type="submit"
					disabled={creating}
					class="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
				>
					{#if creating}
						<Loader2 class="w-4 h-4 animate-spin" /> Creating...
					{:else}
						<Plus class="w-4 h-4" /> Save Category
					{/if}
				</button>
			</div>
		</form>
	</div>

	<!-- Categories Grid -->
	<div class="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
		<h2 class="text-sm font-bold text-foreground">Active Categories ({categories.length})</h2>

		{#if loading}
			<div class="text-center py-6 text-xs text-muted-foreground">Loading master categories...</div>
		{:else if categories.length === 0}
			<div class="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
				No categories found. Create one above!
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
				{#each categories as cat}
					<div class="p-3 bg-secondary/40 border border-border rounded-lg flex items-center justify-between">
						<div class="flex items-center gap-2.5">
							<span class="w-4 h-4 rounded-full" style="background-color: {cat.color || '#6b7280'};"></span>
							<span class="text-xs font-semibold text-foreground">{cat.name}</span>
						</div>
						<button
							on:click={() => handleDelete(cat.id)}
							title="Delete Category"
							class="p-1 text-muted-foreground hover:text-destructive transition-colors"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
