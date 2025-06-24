<script lang="ts">
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { buttonOptions } from './Button.options';
	import type { DraftInsightsResponse, DraftInsightProspect, Prospect } from "$lib/types.js";
	import { onMount } from "svelte";
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser } from '$lib/global-state/user-state.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';
	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import Button from "./Button.svelte";
	
	// Props
	let { position = 7, gameId = '2' }: { position?: number; gameId?: string } = $props();
	
	// State
	let insightsData: DraftInsightsResponse | null = $state(null);
	let loading = $state(true);
	let error: string | null = $state(null);
	let sheetOpen = $state(false);
	
	// Frozen position - locks the position when sidebar opens to prevent jumping
	let frozenPosition = $state(position);
	
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
      return Math.max(...insightsData.data.prospects.map(p => Math.max(...Object.values(p.heatmapData))));
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
			case 'HIGH': return 'text-orange-800 font-bold';
			case 'MEDIUM': return 'text-orange-600 font-bold';
			case 'LOW': return 'text-orange-500 font-bold';
			default: return 'text-gray-600';
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
		const draftedPosition = draftSystem.draftBoard.find(cell => cell.prospect?.id === prospect.prospectId);
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
		const draftedCell = draftSystem.draftBoard.find(cell => cell.prospect?.id === prospectId);
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

  <Button 
    class={buttonOptions({ variant: "info" })}
    onclick={openSheet}
  >
  Draft Insights for Pick {position}
</Button>
  
  
  <Sheet.Content side="left" class="{innerWidth > 768 ? 'w-[600px] max-w-2xl' : 'w-full'} overflow-y-auto">
    <div class="max-w-[395px] mx-auto">
		<Sheet.Header class="space-y-2 pb-4">
			<div class="text-black px-4 py-3 ">
      <h2 class={`
        text-3xl font-extrabold uppercase tracking-[-1px] relative inline-block mb-7
        after:content-[''] after:absolute after:left-0 after:bottom-[-5px] after:w-[40%] after:h-[5px] after:bg-primary
        `}>
        DRAFT INSIGHTS
      </h2>
			</div>
		</Sheet.Header>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="text-center space-y-2">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
					<p class="text-sm text-gray-600">Loading draft insights...</p>
				</div>
			</div>
		{:else if error}
			<div class="bg-red-50 border border-red-200 p-4">
				<p class="text-red-600 text-center">{error}</p>
			</div>
		{:else if insightsData?.data?.prospects.length === 0}
			<div class="bg-gray-50 border border-gray-200 p-4">
				<p class="text-gray-600 text-center">No draft data available for position {frozenPosition}</p>
			</div>
		{:else if insightsData?.data}
			<div class="space-y-6">
				<!-- Header Section -->
				<div class="border-2 border-black p-4 bg-white">
					<h2 class="text-xl font-bold text-center">DRAFT POSITION RANGES</h2>
					<p class="text-center font-bold mt-1">POSITION {frozenPosition} ANALYSIS</p>
				</div>

				<!-- Prospects List -->
				<div class="space-y-6">
					{#each insightsData.data.prospects as prospect, index}
						<div class="border-2 border-black {isProspectDrafted(prospect.prospectId) ? 'border-[3px] border-stone-500 border-dashed' :"border-[3px]"} p-5 bg-white prospect-card">
							<!-- Prospect Header -->
							<div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
								<div class="flex-1">
									<div class="flex items-center gap-3 mb-1">
										<h3 class="text-xl font-bold {isProspectDrafted(prospect.prospectId) ? 'text-stone-500' :"text-black"} ">{prospect.name}</h3>
										{#if isProspectDrafted(prospect.prospectId)}
											{@const draftPosition = getProspectDraftPosition(prospect.prospectId)}
											<div class="px-2 py-1 bg-accent text-sm font-bold border-[3px] border-black mr-3">
												DRAFTED #{draftPosition}
											</div>
										{/if}
									</div>
									<p class="text-sm font-medium text-gray-700 uppercase tracking-wide">
										{prospect.team} • {prospect.position}
									</p>
								</div>
								<div class="text-left sm:text-right">
									<p class="text-3xl font-bold {getPercentageColor(prospect.percentage)}">{prospect.percentage}%</p>
									<p class="text-xs text-gray-600 font-medium">AVG: {prospect.avgPosition}</p>
								</div>
							</div>

							<!-- Heat Map -->
							<div class="mb-6">
								<div class="grid grid-cols-7 gap-3 justify-center">
									{#each Object.entries(prospect.heatmapData) as [pos, count]}
										<!-- {@const maxCount = Math.max(...Object.values(prospect.heatmapData))} -->
										{@const isTargetPosition = parseInt(pos) === frozenPosition}
										<div class="flex flex-col items-center">
											<div class="text-xs font-bold mb-1 text-black">{pos}</div>
											<div 
												class="w-10 h-10 flex items-center justify-center text-sm font-bold border-black border-[3px]
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
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 stats-grid mb-4">
								<div class="flex flex-col items-center justify-end border-[3px] border-black p-3 text-center bg-gray-50">
									<p class="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1">RANGE</p>
									<p class="text-lg font-bold text-black">{prospect.draftRange}</p>
								</div>
								<div class="flex flex-col items-center justify-end border-[3px] border-black p-3 text-center bg-gray-50">
									<p class="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1">MOST COMMON</p>
									<p class="text-lg font-bold text-black">Pick {prospect.mostCommonPosition}</p>
								</div>
								<div class="flex flex-col items-center justify-end border-[3px] border-black p-3 text-center bg-gray-50">
									<p class="text-xs text-gray-600 font-bold uppercase tracking-wide mb-1">CONSISTENCY</p>
									<p class="text-lg font-bold {getConsistencyColor(prospect.consistency)}">{prospect.consistency}</p>
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
				<div class="bg-yellow-100 border-[3px] border-yellow-400 p-4">
					<h4 class="text-sm font-bold text-black mb-3 uppercase tracking-wide">LEGEND:</h4>
					<div class="flex flex-col gap-6 text-sm">
						<div class="flex flex-col gap-2">
							<div class="w-5 h-5 bg-orange-500 border-[3px] border-black rounded shadow-lg ring-4"></div>
							<span class="font-medium">CURRENT PICK ({frozenPosition})</span>
						</div>
						<div class="flex flex-col gap-2">
              <div class="flex gap-2">

                <div class="flex flex-col items-center gap-1">
                  <div class="w-5 h-5 bg-orange-100 border-2 border-gray-400 rounded"></div>
                  <p class="text-xs">least</p>
                </div>

                <div class="w-5 h-5 mr-1 bg-orange-300 border-2 border-gray-400 rounded"></div>
                <div class="w-5 h-5 mr-1 bg-orange-500 border-2 border-gray-400 rounded"></div>
                <div class="w-5 h-5 bg-orange-700 border-2 border-gray-400 rounded"></div>

                <div class="flex flex-col items-center gap-1">
                  <div class="w-5 h-5 bg-orange-900 border-2 border-gray-400 rounded"></div>
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
			<Sheet.Close class={buttonVariants({ variant: "outline", class: "w-full" })}>
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