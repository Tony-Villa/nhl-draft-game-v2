<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { buttonOptions } from './Button.options';
	import type { DraftInsightsResponse, DraftInsightProspect, Prospect } from '$lib/types.js';
	import { onMount, untrack } from 'svelte';
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser } from '$lib/global-state/user-state.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';
	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import Button from './Button.svelte';

	// Props
	let { position = 7, gameId = '2' }: { position?: number; gameId?: string } = $props();

	// State
	let insightsData: DraftInsightsResponse | null = $state(null);
	let loading = $state(true);
	let error: string | null = $state(null);
	let sheetOpen = $state(false);

	// Frozen position - locks the position when sidebar opens to prevent jumping
	let frozenPosition = $state(untrack(() => position));

	// Update frozen position only when the sheet is closed
	$effect(() => {
		if (!sheetOpen) {
			// When sheet is closed, allow position to update
			frozenPosition = position;
		}
	});

	// Function to handle opening the sheet and freezing position
	function openSheet() {
		// frozenPosition is already set to current position from the effect above
		sheetOpen = true;
	}

	let maxCount = $derived.by(() => {
		if (insightsData?.data?.prospects.length) {
			return Math.max(
				...insightsData.data.prospects.map((p) => Math.max(...Object.values(p.heatmapData)))
			);
		}
		return 0;
	});

	// Global state
	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();
	const draftState = getDraftState();

	// Fetch draft insights data
	async function fetchDraftInsights() {
		try {
			loading = true;
			error = null;

			// Use frozen position to prevent sidebar from jumping when drafts change
			const params = new URLSearchParams({
				gameId,
				position: frozenPosition.toString()
			});

			const response = await fetch(`/api/draft-insights?${params}`);
			const data = await response.json();

			if (data.success) {
				insightsData = data;
			} else {
				error = data.error || 'Failed to load draft insights';
			}
		} catch (err) {
			error = 'Failed to load draft insights';
			console.error('Draft insights error:', err);
		} finally {
			loading = false;
		}
	}

	// Get heat map cell color based on value and max - single blue color with intensity
	function getHeatMapColor(value: number, maxValue: number): string {
		if (value === 0) return 'bg-white';
		const intensity = value / maxValue;

		if (intensity === 1) return 'bg-orange-900';
		if (intensity >= 0.8) return 'bg-orange-700 text-black font-bold';
		if (intensity >= 0.6) return 'bg-orange-500 text-black font-semibold';
		if (intensity >= 0.4) return 'bg-orange-300 text-black font-medium';
		if (intensity >= 0.2) return 'bg-orange-100 text-gray-900';
		return 'bg-orange-100 text-gray-900';
	}

	function getPercentageColor(percentage: number): string {
		if (percentage >= 90) return 'text-orange-950 font-bold';
		if (percentage >= 50) return 'text-orange-800 font-bold';
		if (percentage >= 30) return 'text-orange-700 font-bold';
		if (percentage >= 20) return 'text-orange-500 font-bold';
		if (percentage >= 10) return 'text-orange-400 font-bold';
		return 'text-orange-300';
	}

	// Get consistency color
	function getConsistencyColor(consistency: string): string {
		switch (consistency) {
			case 'HIGH':
				return 'text-orange-800 font-bold';
			case 'MEDIUM':
				return 'text-orange-600 font-bold';
			case 'LOW':
				return 'text-orange-500 font-bold';
			default:
				return 'text-gray-600';
		}
	}

	// Draft function - adapted from ProspectCard
	function draftProspect(prospect: DraftInsightProspect) {
		// Convert DraftInsightProspect to Prospect type
		const prospectToDraft: Prospect = {
			id: prospect.prospectId,
			name: prospect.name,
			position: prospect.position,
			team: prospect.team,
			rank: '-', // Default rank since not provided in insights
			nation: '', // Default nation since not provided in insights
			league: '',
			birthDay: '',
			height: '',
			weight: '',
			shoots: ''
		};

		// Use frozen position to ensure consistent drafting behavior
		draftSystem.addProspectToBoard(prospectToDraft, frozenPosition);
		draftState.updateDraftStatus(false);

		if (!currentUser?.user || !('id' in currentUser.user)) {
			localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
		}

		// Close the sheet after drafting
		sheetOpen = false;
	}

	// Undraft function - adapted from ProspectCard
	function undraftProspect(prospect: DraftInsightProspect) {
		// Find which position this prospect is drafted to
		const draftedPosition = draftSystem.draftBoard.find(
			(cell) => cell.prospect?.id === prospect.prospectId
		);
		if (draftedPosition) {
			const prospectToUndraft: Prospect = {
				id: prospect.prospectId,
				name: prospect.name,
				position: prospect.position,
				team: prospect.team,
				rank: '-',
				nation: '',
				league: '',
				birthDay: '',
				height: '',
				weight: '',
				shoots: ''
			};

			draftSystem.removeProspectFromBoard(prospectToUndraft, draftedPosition.draftPosition);
			draftState.updateDraftStatus(false);

			if (!currentUser?.user || !('id' in currentUser.user)) {
				localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
			}
		}
	}

	// Check if a prospect is drafted using global state (includes temporary drafts)
	function isProspectDrafted(prospectId: string): boolean {
		return draftSystem.isDrafted(prospectId);
	}

	// Get the position where a prospect is drafted (if any)
	function getProspectDraftPosition(prospectId: string): number | null {
		const draftedCell = draftSystem.draftBoard.find((cell) => cell.prospect?.id === prospectId);
		return draftedCell ? draftedCell.draftPosition : null;
	}

	// Reactive statement to fetch data when frozen position or gameId changes
	$effect(() => {
		if (frozenPosition || gameId) {
			fetchDraftInsights();
		}
	});

	onMount(() => {
		fetchDraftInsights();
	});

	let innerWidth = $state(0);
</script>

<svelte:window bind:innerWidth />
<Sheet.Root bind:open={sheetOpen}>
	<Button class={buttonOptions({ variant: 'info' })} onclick={openSheet}>
		Draft Insights for Pick {position}
	</Button>

	<Sheet.Content
		side="left"
		class="{innerWidth > 768 ? 'w-[600px] max-w-2xl' : 'w-full'} overflow-y-auto"
	>
		<div class="mx-auto max-w-[395px]">
			<Sheet.Header class="space-y-2 pb-4">
				<div class="px-4 py-3 text-black">
					<h2
						class={`
        after:bg-primary relative mb-7 inline-block text-3xl font-extrabold tracking-[-1px]
        uppercase after:absolute after:bottom-[-5px] after:left-0 after:h-[5px] after:w-[40%] after:content-['']
        `}
					>
						DRAFT INSIGHTS
					</h2>
				</div>
			</Sheet.Header>

			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="space-y-2 text-center">
						<div
							class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"
						></div>
						<p class="text-sm text-gray-600">Loading draft insights...</p>
					</div>
				</div>
			{:else if error}
				<div class="border border-red-200 bg-red-50 p-4">
					<p class="text-center text-red-600">{error}</p>
				</div>
			{:else if insightsData?.data?.prospects.length === 0}
				<div class="border border-gray-200 bg-gray-50 p-4">
					<p class="text-center text-gray-600">
						No draft data available for position {frozenPosition}
					</p>
				</div>
			{:else if insightsData?.data}
				<div class="space-y-6">
					<!-- Header Section -->
					<div class="border-2 border-black bg-white p-4">
						<h2 class="text-center text-xl font-bold">DRAFT POSITION RANGES</h2>
						<p class="mt-1 text-center font-bold">POSITION {frozenPosition} ANALYSIS</p>
					</div>

					<!-- Prospects List -->
					<div class="space-y-6">
						{#each insightsData.data.prospects as prospect, index}
							<div
								class="border-2 border-black {isProspectDrafted(prospect.prospectId)
									? 'border-[3px] border-dashed border-stone-500'
									: 'border-[3px]'} prospect-card bg-white p-5"
							>
								<!-- Prospect Header -->
								<div
									class="mb-4 flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
								>
									<div class="flex-1">
										<div class="mb-1 flex items-center gap-3">
											<h3
												class="text-xl font-bold {isProspectDrafted(prospect.prospectId)
													? 'text-stone-500'
													: 'text-black'} "
											>
												{prospect.name}
											</h3>
											{#if isProspectDrafted(prospect.prospectId)}
												{@const draftPosition = getProspectDraftPosition(prospect.prospectId)}
												<div
													class="bg-accent mr-3 border-[3px] border-black px-2 py-1 text-sm font-bold"
												>
													DRAFTED #{draftPosition}
												</div>
											{/if}
										</div>
										<p class="text-sm font-medium tracking-wide text-gray-700 uppercase">
											{prospect.team} • {prospect.position}
										</p>
									</div>
									<div class="text-left sm:text-right">
										<p class="text-3xl font-bold {getPercentageColor(prospect.percentage)}">
											{prospect.percentage}%
										</p>
										<p class="text-xs font-medium text-gray-600">AVG: {prospect.avgPosition}</p>
									</div>
								</div>

								<!-- Heat Map -->
								<div class="mb-6">
									<div class="grid grid-cols-7 justify-center gap-3">
										{#each Object.entries(prospect.heatmapData) as [pos, count]}
											<!-- {@const maxCount = Math.max(...Object.values(prospect.heatmapData))} -->
											{@const isTargetPosition = parseInt(pos) === frozenPosition}
											<div class="flex flex-col items-center">
												<div class="mb-1 text-xs font-bold text-black">{pos}</div>
												<div
													class="flex h-10 w-10 items-center justify-center border-[3px] border-black text-sm font-bold
												{isTargetPosition ? `ring-4 ${getHeatMapColor(count, maxCount)}` : ''} 
												{!isTargetPosition ? getHeatMapColor(count, maxCount) : ''}"
												>
													<!-- {count > 0 ? count : ''} -->
												</div>
											</div>
										{/each}
									</div>
								</div>

								<!-- Stats Row -->
								<div class="stats-grid mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
									<div
										class="flex flex-col items-center justify-end border-[3px] border-black bg-gray-50 p-3 text-center"
									>
										<p class="mb-1 text-xs font-bold tracking-wide text-gray-600 uppercase">
											RANGE
										</p>
										<p class="text-lg font-bold text-black">{prospect.draftRange}</p>
									</div>
									<div
										class="flex flex-col items-center justify-end border-[3px] border-black bg-gray-50 p-3 text-center"
									>
										<p class="mb-1 text-xs font-bold tracking-wide text-gray-600 uppercase">
											MOST COMMON
										</p>
										<p class="text-lg font-bold text-black">Pick {prospect.mostCommonPosition}</p>
									</div>
									<div
										class="flex flex-col items-center justify-end border-[3px] border-black bg-gray-50 p-3 text-center"
									>
										<p class="mb-1 text-xs font-bold tracking-wide text-gray-600 uppercase">
											CONSISTENCY
										</p>
										<p class="text-lg font-bold {getConsistencyColor(prospect.consistency)}">
											{prospect.consistency}
										</p>
									</div>
								</div>

								<!-- Draft Button -->
								<div class="flex justify-center">
									{#if isProspectDrafted(prospect.prospectId)}
										<button
											class={buttonOptions({
												class: 'w-full sm:w-[60%]',
												variant: 'outline'
											})}
											onclick={() => undraftProspect(prospect)}
										>
											Undraft
										</button>
									{:else}
										<button
											class={buttonOptions({
												class: 'w-full sm:w-[60%]',
												variant: 'primary'
											})}
											onclick={() => draftProspect(prospect)}
										>
											Draft {prospect.name}
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>

					<!-- Legend -->
					<div class="border-[3px] border-yellow-400 bg-yellow-100 p-4">
						<h4 class="mb-3 text-sm font-bold tracking-wide text-black uppercase">LEGEND:</h4>
						<div class="flex flex-col gap-6 text-sm">
							<div class="flex flex-col gap-2">
								<div
									class="h-5 w-5 rounded border-[3px] border-black bg-orange-500 shadow-lg ring-4"
								></div>
								<span class="font-medium">CURRENT PICK ({frozenPosition})</span>
							</div>
							<div class="flex flex-col gap-2">
								<div class="flex gap-2">
									<div class="flex flex-col items-center gap-1">
										<div class="h-5 w-5 rounded border-2 border-gray-400 bg-orange-100"></div>
										<p class="text-xs">least</p>
									</div>

									<div class="mr-1 h-5 w-5 rounded border-2 border-gray-400 bg-orange-300"></div>
									<div class="mr-1 h-5 w-5 rounded border-2 border-gray-400 bg-orange-500"></div>
									<div class="h-5 w-5 rounded border-2 border-gray-400 bg-orange-700"></div>

									<div class="flex flex-col items-center gap-1">
										<div class="h-5 w-5 rounded border-2 border-gray-400 bg-orange-900"></div>
										<p class="text-xs">most</p>
									</div>
								</div>
								<span class="font-medium">DRAFT FREQUENCY</span>
							</div>
							<!-- <div class="flex items-center gap-2">
							<div class="w-5 h-5 bg-green-500 border-2 border-green-700 rounded"></div>
							<span class="font-medium">ALREADY DRAFTED</span>
						</div> -->
						</div>
					</div>
				</div>
			{/if}

			<Sheet.Footer class="pt-4">
				<Sheet.Close class={buttonVariants({ variant: 'outline', class: 'w-full' })}>
					Close
				</Sheet.Close>
			</Sheet.Footer>
		</div>
	</Sheet.Content>
</Sheet.Root>

<style>
	/* Ensure proper spacing and responsiveness on all screen sizes */
	@media (max-width: 640px) {
		:global(.sheet-content) {
			width: 100vw;
			max-width: none;
			padding: 1rem;
		}

		/* Adjust heat map on mobile */
		.grid-cols-7 {
			gap: 0.25rem;
		}

		/* Adjust prospect cards on mobile */
		.prospect-card {
			padding: 1rem;
		}
	}

	@media (max-width: 480px) {
		/* Stack stats vertically on very small screens */
		.stats-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
	}
</style>
