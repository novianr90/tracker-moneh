<script lang="ts">
	import { onMount } from 'svelte';
	import { expenseService, type DailyTrendPoint } from '$lib/services/expenses';
	import { formatIDR, formatDate } from '$lib/utils/formatters';
	import { TrendingUp, Calendar, ArrowUpRight, BarChart2, LineChart as LineChartIcon } from 'lucide-svelte';

	let currentMonthTrends: DailyTrendPoint[] = [];
	let prevMonthTrends: DailyTrendPoint[] = [];
	let loading = true;

	// Controls state
	let selectedPeriod: 'current' | 'previous' = 'current';
	let chartViewMode: 'daily' | 'cumulative' = 'daily';
	let hoverPoint: DailyTrendPoint | null = null;
	let hoverIndex: number | null = null;

	async function loadTrends() {
		loading = true;
		try {
			const now = new Date();
			const currentIso = now.toISOString().split('T')[0];
			
			// Compute previous month date
			const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const prevIso = prevDate.toISOString().split('T')[0];

			const [currData, prevData] = await Promise.all([
				expenseService.getDailyExpenseTrends(currentIso),
				expenseService.getDailyExpenseTrends(prevIso)
			]);

			currentMonthTrends = currData;
			prevMonthTrends = prevData;
		} catch (err: any) {
			console.error('Failed loading daily trends:', err);
		} finally {
			loading = false;
		}
	}

	$: activeTrends = selectedPeriod === 'current' ? currentMonthTrends : prevMonthTrends;

	// Metrics calculations
	$: maxDailySpend = activeTrends.length > 0 ? Math.max(...activeTrends.map((t) => t.daily_total), 1) : 1;
	$: maxCumulativeSpend = activeTrends.length > 0 ? Math.max(...activeTrends.map((t) => t.cumulative_total), 1) : 1;
	$: totalPeriodSpend = activeTrends.length > 0 ? activeTrends[activeTrends.length - 1].cumulative_total : 0;
	$: avgDailySpend = activeTrends.length > 0 ? Math.round(totalPeriodSpend / activeTrends.length) : 0;
	$: peakDay = activeTrends.length > 0 ? activeTrends.reduce((max, point) => (point.daily_total > max.daily_total ? point : max), activeTrends[0]) : null;

	// SVG Dimensions
	const svgWidth = 800;
	const svgHeight = 240;
	const padding = { top: 25, right: 25, bottom: 35, left: 35 };
	const chartWidth = svgWidth - padding.left - padding.right;
	const chartHeight = svgHeight - padding.top - padding.bottom;

	// Generate SVG points path
	$: pointsPath = (() => {
		if (activeTrends.length === 0) return '';
		const maxVal = chartViewMode === 'daily' ? maxDailySpend : maxCumulativeSpend;
		return activeTrends
			.map((point, index) => {
				const val = chartViewMode === 'daily' ? point.daily_total : point.cumulative_total;
				const x = padding.left + (index / Math.max(activeTrends.length - 1, 1)) * chartWidth;
				const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
				return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	})();

	$: areaPath = (() => {
		if (!pointsPath || activeTrends.length === 0) return '';
		const firstX = padding.left;
		const lastX = padding.left + chartWidth;
		const bottomY = padding.top + chartHeight;
		return `${pointsPath} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;
	})();

	function getPointCoordinates(index: number, val: number) {
		const maxVal = chartViewMode === 'daily' ? maxDailySpend : maxCumulativeSpend;
		const x = padding.left + (index / Math.max(activeTrends.length - 1, 1)) * chartWidth;
		const y = padding.top + chartHeight - (val / Math.max(maxVal, 1)) * chartHeight;
		return { x, y };
	}

	onMount(() => {
		loadTrends();
	});
</script>

<div class="p-6 bg-card border border-border rounded-lg shadow-lg space-y-5">
	<!-- Card Header & Controls -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h3 class="text-md font-bold text-foreground flex items-center gap-2">
				<TrendingUp class="w-5 h-5 text-primary" />
				Spending Velocity & Daily Trends
			</h3>
			<p class="text-xs text-muted-foreground">Interactive analytics comparing daily spend spikes and cumulative growth</p>
		</div>

		<!-- Control Buttons -->
		<div class="flex items-center gap-2 flex-wrap">
			<!-- Period Switcher -->
			<div class="bg-secondary p-1 rounded-lg flex items-center gap-1 text-xs">
				<button
					type="button"
					on:click={() => (selectedPeriod = 'current')}
					class="px-2.5 py-1 rounded-md font-semibold transition-colors {selectedPeriod === 'current' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}"
				>
					This Month
				</button>
				<button
					type="button"
					on:click={() => (selectedPeriod = 'previous')}
					class="px-2.5 py-1 rounded-md font-semibold transition-colors {selectedPeriod === 'previous' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}"
				>
					Last Month
				</button>
			</div>

			<!-- View Mode Toggle -->
			<div class="bg-secondary p-1 rounded-lg flex items-center gap-1 text-xs">
				<button
					type="button"
					on:click={() => (chartViewMode = 'daily')}
					title="Daily Bars"
					class="px-2 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 {chartViewMode === 'daily' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}"
				>
					<BarChart2 class="w-3.5 h-3.5" /> Daily
				</button>
				<button
					type="button"
					on:click={() => (chartViewMode = 'cumulative')}
					title="Cumulative Velocity"
					class="px-2 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 {chartViewMode === 'cumulative' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}"
				>
					<LineChartIcon class="w-3.5 h-3.5" /> Cumulative
				</button>
			</div>
		</div>
	</div>

	<!-- Summary Stat Badges -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
		<div class="p-3 bg-secondary/30 border border-border rounded-lg flex items-center justify-between">
			<div>
				<div class="text-[11px] text-muted-foreground font-medium">Period Total</div>
				<div class="text-sm font-bold text-foreground">{formatIDR(totalPeriodSpend)}</div>
			</div>
			<div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
				<ArrowUpRight class="w-4 h-4" />
			</div>
		</div>

		<div class="p-3 bg-secondary/30 border border-border rounded-lg flex items-center justify-between">
			<div>
				<div class="text-[11px] text-muted-foreground font-medium">Daily Average</div>
				<div class="text-sm font-bold text-foreground">{formatIDR(avgDailySpend)} / day</div>
			</div>
			<div class="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center font-bold text-xs">
				Avg
			</div>
		</div>

		<div class="p-3 bg-secondary/30 border border-border rounded-lg flex items-center justify-between">
			<div>
				<div class="text-[11px] text-muted-foreground font-medium">Peak Spending Day</div>
				<div class="text-sm font-bold text-foreground">
					{#if peakDay && peakDay.daily_total > 0}
						{formatDate(peakDay.expense_date)} ({formatIDR(peakDay.daily_total)})
					{:else}
						No activity
					{/if}
				</div>
			</div>
			<div class="w-8 h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
				<Calendar class="w-4 h-4" />
			</div>
		</div>
	</div>

	<!-- Interactive Chart SVG Container -->
	{#if loading}
		<div class="h-60 flex items-center justify-center text-xs text-muted-foreground">
			Loading trend analytics...
		</div>
	{:else if activeTrends.length === 0}
		<div class="h-60 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
			No trend data recorded for selected period.
		</div>
	{:else}
		<div class="relative w-full overflow-hidden bg-background/50 border border-border/80 rounded-xl p-2">
			<!-- SVG Visualization -->
			<svg viewBox="0 0 {svgWidth} {svgHeight}" class="w-full h-auto overflow-visible select-none">
				<defs>
					<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35" />
						<stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
					</linearGradient>
					<linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#6366f1" stop-opacity="0.9" />
						<stop offset="100%" stop-color="#3b82f6" stop-opacity="0.5" />
					</linearGradient>
				</defs>

				<!-- Horizontal Grid Lines -->
				{#each [0, 0.25, 0.5, 0.75, 1] as ratio}
					{@const y = padding.top + chartHeight * (1 - ratio)}
					<line
						x1={padding.left}
						y1={y}
						x2={svgWidth - padding.right}
						y2={y}
						stroke="currentColor"
						stroke-opacity="0.08"
						stroke-dasharray="4,4"
					/>
				{/each}

				{#if chartViewMode === 'cumulative'}
					<!-- Gradient Area Fill -->
					<path d={areaPath} fill="url(#areaGradient)" />

					<!-- Trend Curve Line -->
					<path
						d={pointsPath}
						fill="none"
						stroke="#3b82f6"
						stroke-width="3"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				{/if}

				<!-- Data Points / Bars & Interactive Areas -->
				{#each activeTrends as point, index}
					{@const val = chartViewMode === 'daily' ? point.daily_total : point.cumulative_total}
					{@const coords = getPointCoordinates(index, val)}
					{@const isPeak = peakDay && point.expense_date === peakDay.expense_date && point.daily_total > 0}

					{#if chartViewMode === 'daily'}
						{@const barWidth = Math.max(chartWidth / activeTrends.length - 4, 4)}
						{@const barHeight = ((point.daily_total / Math.max(maxDailySpend, 1)) * chartHeight)}
						{@const barX = coords.x - barWidth / 2}
						{@const barY = padding.top + chartHeight - barHeight}

						<!-- Daily Bar -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<rect
							x={barX}
							y={barY}
							width={barWidth}
							height={Math.max(barHeight, 2)}
							rx="3"
							role="graphics-symbol"
							aria-label="Daily expense {formatDate(point.expense_date)}"
							fill={isPeak ? '#ef4444' : hoverIndex === index ? '#8b5cf6' : 'url(#barGradient)'}
							class="transition-all duration-150 cursor-pointer hover:opacity-90"
							on:mouseenter={() => { hoverPoint = point; hoverIndex = index; }}
							on:mouseleave={() => { hoverPoint = null; hoverIndex = null; }}
						/>
					{:else}
						<!-- Cumulative Line Circle Point -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<circle
							cx={coords.x}
							cy={coords.y}
							r={hoverIndex === index ? 6 : 4}
							role="graphics-symbol"
							aria-label="Cumulative expense {formatDate(point.expense_date)}"
							fill={hoverIndex === index ? '#8b5cf6' : '#3b82f6'}
							stroke="#ffffff"
							stroke-width="2"
							class="transition-all duration-150 cursor-pointer"
							on:mouseenter={() => { hoverPoint = point; hoverIndex = index; }}
							on:mouseleave={() => { hoverPoint = null; hoverIndex = null; }}
						/>
					{/if}

					<!-- Transparent Hover Hit Area -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<rect
						x={coords.x - (chartWidth / activeTrends.length) / 2}
						y={padding.top}
						width={chartWidth / activeTrends.length}
						height={chartHeight}
						fill="transparent"
						role="presentation"
						class="cursor-pointer"
						on:mouseenter={() => { hoverPoint = point; hoverIndex = index; }}
						on:mouseleave={() => { hoverPoint = null; hoverIndex = null; }}
					/>
				{/each}

				<!-- Active Hover Vertical Guideline -->
				{#if hoverIndex !== null}
					{@const activePoint = activeTrends[hoverIndex]}
					{@const activeVal = chartViewMode === 'daily' ? activePoint.daily_total : activePoint.cumulative_total}
					{@const activeCoords = getPointCoordinates(hoverIndex, activeVal)}
					<line
						x1={activeCoords.x}
						y1={padding.top}
						x2={activeCoords.x}
						y2={padding.top + chartHeight}
						stroke="#8b5cf6"
						stroke-width="1.5"
						stroke-dasharray="3,3"
					/>
				{/if}

				<!-- Date X-Axis Labels -->
				{#each activeTrends as point, index}
					{#if index % Math.ceil(activeTrends.length / 8) === 0 || index === activeTrends.length - 1}
						{@const coords = getPointCoordinates(index, 0)}
						{@const dayNum = point.expense_date.split('-')[2]}
						<text
							x={coords.x}
							y={svgHeight - 10}
							text-anchor="middle"
							class="text-[10px] fill-muted-foreground font-medium"
						>
							{dayNum}
						</text>
					{/if}
				{/each}
			</svg>

			<!-- Hover Tooltip Overlay -->
			{#if hoverPoint && hoverIndex !== null}
				{@const val = chartViewMode === 'daily' ? hoverPoint.daily_total : hoverPoint.cumulative_total}
				{@const coords = getPointCoordinates(hoverIndex, val)}
				<div
					class="absolute z-20 pointer-events-none p-2.5 bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-lg text-xs space-y-1 transform -translate-x-1/2 -translate-y-full transition-all duration-75"
					style="left: {(coords.x / svgWidth) * 100}%; top: {Math.max((coords.y / svgHeight) * 100 - 4, 10)}%;"
				>
					<div class="font-bold text-foreground flex items-center gap-1.5">
						<Calendar class="w-3.5 h-3.5 text-primary" />
						{formatDate(hoverPoint.expense_date)}
					</div>
					<div class="text-muted-foreground flex items-center justify-between gap-4">
						<span>Daily Spent:</span>
						<span class="font-semibold text-foreground">{formatIDR(hoverPoint.daily_total)}</span>
					</div>
					<div class="text-muted-foreground flex items-center justify-between gap-4">
						<span>Cumulative Total:</span>
						<span class="font-semibold text-primary">{formatIDR(hoverPoint.cumulative_total)}</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
