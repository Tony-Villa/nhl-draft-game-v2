<script lang="ts">
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import type { PositionFilter } from '$lib/types';
	import MultipleSelect from './MultipleSelect.svelte';
	import ProspectCard from './ProspectCard.svelte';
	import Searchbar from './Searchbar.svelte';
	import { fetchProspects, type ProspectsResponse } from '$lib/helpers/fetch-prospects';

	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
	import { buttonOptions } from './Button.options';

	const prospectSystem = getDraftSystem();

	// State for filters and pagination
	let searchInput: string = $state('');
	let positions: string[] = $state([]);
	let currentPage = $state(1);
	let sortBy: 'rank' | 'name' | 'height' | 'age' = $state('rank');
	let sortOrder: 'asc' | 'desc' = $state('asc');
	let isLoading = $state(false);
	
	const itemsPerPage = 12;
	const currentYear = new Date().getFullYear();

	// API response state
	let prospectsResponse: ProspectsResponse = $state({
		prospects: [],
		pagination: {
			currentPage: 1,
			totalPages: 1,
			totalCount: 0,
			limit: itemsPerPage,
			hasNextPage: false,
			hasPrevPage: false
		}
	});

	let derivedPositionFilter = $derived.by(() => {
		let p = [...positions];
		
		if (p.includes('C') || p.includes('LW') || p.includes('RW')) {
			p.push('F');
		}
		return p.length > 0 ? p.join(',') : '';
	});
	
	let sortFilter = $state({
		C: false,
		LW: false,
		RW: false,
		D: false,
		G: false
	});

	// Get prospects with draft status applied
	let currentProspects = $derived.by(() => {
		// Access the reactive sets to trigger reactivity
		prospectSystem.temporaryDraftedIds.size;
		prospectSystem.permanentDraftedIds.size;
		
		if (prospectsResponse.prospects.length === 0) {
			return [];
		}
		
		try {
			// Add proper draft status to the API response prospects
			const result = prospectsResponse.prospects.map((prospect) => {
				const isDrafted = prospect.id ? prospectSystem.isDrafted(prospect.id) : false;
				const isTemporary = prospect.id ? prospectSystem.isTemporarilyDrafted(prospect.id) : false;
				const isPermanent = prospect.id ? prospectSystem.permanentDraftedIds.has(prospect.id) : false;
				
				return {
					...prospect,
					isDrafted,
					isTemporary,
					isPermanent
				};
			});
			
			return result;
		} catch (error) {
			// Error in prospect processing - logged on server side
			return [];
		}
	});

	// All prospects for display - show all prospects but with draft status
	let displayProspects = $derived.by(() => {
		// Return all prospects - don't filter out drafted ones
		return currentProspects;
	});

	// Debounced search function
	let searchTimeout: number | undefined;
	
	async function loadProspects() {
		if (isLoading) return;
		
		isLoading = true;
		try {
			// Fetch a few extra prospects to account for potential filtering
			const fetchLimit = itemsPerPage + 4; // Fetch 4 extra to account for drafted prospects
			
			const response = await fetchProspects({
				page: currentPage,
				limit: fetchLimit,
				search: searchInput.trim() || undefined,
				position: derivedPositionFilter || undefined,
				sortBy,
				sortOrder,
				year: currentYear
			});
			
			prospectsResponse = response;
		} catch (error) {
			// Error loading prospects - logged on server side
		} finally {
			isLoading = false;
		}
	}

	// Load initial prospects only once on mount
	let mounted = false;
	$effect(() => {
		if (!mounted) {
			mounted = true;
			loadProspects();
		}
	});

	// Debounced search (but not on initial mount)
	$effect(() => {
		if (!mounted) return;
		
		searchInput;
		
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = Number(setTimeout(() => {
			currentPage = 1;
			loadProspects();
		}, 300));
	});


	const sortByPosition = (options: PositionFilter, option: string) => {
		options[option] = !options[option];
		for (const position of positions) {
			if (position === option && !options[option]) {
				positions = positions.filter((pos) => pos !== option);
			}
		}
		if (options[option]) {
			positions.push(option);
		}
		
		// Manually trigger filter reload
		currentPage = 1;
		loadProspects();
	};

	// Handle page changes
	function handlePageChange(page: number) {
		currentPage = page;
		loadProspects();
		window.scrollTo(0, 0);
	}
</script>

<div class={`
max-h-fit overflow-auto p-6 bg-white border-black border-[5px] relative mb-7 min-h-dvh md:shadow-section-shadow md:rotate-[0.3deg]
max-w-[880px] 
flex flex-[4] flex-col flex-wrap gap-2 pb-4`
}>

	<div class="flex w-full justify-between">

		<h2 class={`
			text-3xl font-extrabold uppercase tracking-[-1px] relative inline-block mb-7
			after:content-[''] after:absolute after:left-0 after:bottom-[-5px] after:w-[40%] after:h-[5px] after:bg-primary
			`}>
			Available Prospects	
		</h2>
	</div>

	<div class="flex flex-col gap-5 lg:flex-row mb-4">
		<Searchbar bind:value={searchInput} placeholder="Search Prospect" />
		<MultipleSelect bind:sortFilter sortPosition={sortByPosition} />
	</div>

	{#if isLoading}
		<div class="flex justify-center items-center py-8">
			<div class="text-lg font-bold">Loading prospects...</div>
		</div>
	{:else}
		<div class="mb-12 grid grid-cols-1 md:grid-cols-2 justify-between gap-6 md:justify-start">
			{#each displayProspects as prospect}
				<ProspectCard {prospect} />
			{/each}

			{#if displayProspects.length === 0}
				<div class="col-span-full text-center py-8">
					<p class="text-lg font-bold">No prospects found</p>
					<p class="text-sm text-gray-600">
						API Response: {prospectsResponse.prospects.length} prospects
						<br>
						Display: {displayProspects.length} prospects
						<br>
						Total: {prospectsResponse.pagination.totalCount}
					</p>
				</div>
			{/if}
		</div>
	{/if}

	<div class="w-full mx-auto mb-4">
		<Pagination.Root 
			count={prospectsResponse.pagination.totalCount} 
			perPage={itemsPerPage} 
			siblingCount={1} 
			bind:page={currentPage}
		>
			{#snippet children({ pages, currentPage: pageCurrent }: { pages: any[]; currentPage: number })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton 
							class={`${buttonOptions({variant: 'outline'})} rounded-none mr-2`} 
							onclick={() => handlePageChange(pageCurrent - 1)}
							disabled={!prospectsResponse.pagination.hasPrevPage || isLoading}
						>
							<ChevronLeft class="size-4" />
							<span class="hidden sm:block">Previous</span>
						</Pagination.PrevButton>
					</Pagination.Item>
					{#each pages as page (page.key)}
						{#if page.type === "ellipsis"}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
						{:else}
							<Pagination.Item>
								<Pagination.Link 
									{page} 
									isActive={pageCurrent === page.value} 
									onclick={() => handlePageChange(page.value)}
									disabled={isLoading}
								>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton 
							class={`${buttonOptions({variant: 'outline'})} rounded-none`} 
							onclick={() => handlePageChange(pageCurrent + 1)}
							disabled={!prospectsResponse.pagination.hasNextPage || isLoading}
						>
							<span class="hidden sm:block">Next</span>
							<ChevronRight class="size-4" />
						</Pagination.NextButton>
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
		
		<!-- Pagination info -->
		<div class="text-center mt-2 text-sm text-gray-600">
			Showing {displayProspects.length} prospects 
			({prospectsResponse.prospects.length} from API)
			of {prospectsResponse.pagination.totalCount} total
			(Page {prospectsResponse.pagination.currentPage} of {prospectsResponse.pagination.totalPages})
		</div>
	</div>
</div>