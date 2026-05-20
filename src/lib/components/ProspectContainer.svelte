<script lang="ts">
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import type { PositionFilter } from '$lib/types';
	import MultipleSelect from './MultipleSelect.svelte';
	import ProspectCard from './ProspectCard.svelte';
	import ProspectCardSkeleton from './ProspectCardSkeleton.svelte';
	import Searchbar from './Searchbar.svelte';
	import { fetchProspects, type ProspectsResponse } from '$lib/helpers/fetch-prospects';

	import IconPlaceholder from '$lib/components/IconPlaceholder.svelte';
  import * as Pagination from "$lib/components/ui/pagination/index.js";
	import Button from './Button.svelte';
	import { buttonOptions } from './Button.options';
	import { dev } from '$app/environment';

	const prospectSystem = getDraftSystem();

	const verbeekJoke = `Verbeek's only important stat (Height)`

	const prospectSortOptions = [
		{ label: 'Rank', value: 'rank' },
		{ label: verbeekJoke , value: 'height' },
		{ label: 'Age', value: 'age' },
		{ label: 'Name', value: 'name' },
	];

	// Filters and pagination
	let searchInput: string = $state('');
	let positions: string[] = $state([]);
	let currentPage = $state(1);
	let sortBy: 'rank' | 'name' | 'height' | 'age' = $state('rank');
	let sortOrder: 'asc' | 'desc' = $state('asc');
	let isLoading = $state(false);
	let isDropdownOpen = $state(false);
	
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

	let innerWidth = $state(0);
	let shouldtakeHalfScreen = $derived.by(() => {
			return innerWidth < 1250 && innerWidth > 768
		})


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

	let currentProspects = $derived.by(() => {
		prospectSystem.temporaryDraftedIds.size;
		prospectSystem.permanentDraftedIds.size;
		
		if (prospectsResponse.prospects.length === 0) {
			return [];
		}
		
		try {

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
			return [];
		}
	});

	let displayProspects = $derived.by(() => {
		return currentProspects;
	});

	// Debounced search function
	let searchTimeout: number | undefined;
	
	async function loadProspects() {
		if (isLoading) return;
		
		isLoading = true;
		try {
			const response = await fetchProspects({
				page: currentPage,
				limit: itemsPerPage,
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
		
		currentPage = 1;
		loadProspects();
	};

	function handlePageChange(page: number) {
		currentPage = page;
		loadProspects();
		window.scrollTo(0, 0);
	}

	function handleSortChange(value: string | undefined) {
		if (value && (value === 'rank' || value === 'name' || value === 'height' || value === 'age')) {
			if(value === 'height') {
				sortBy = value;
				sortOrder = 'desc'; // Default to descending for height
				currentPage = 1;
				loadProspects();
			} else {
				sortBy = value;
				sortOrder = 'asc'; // Default to ascending for other fields
				currentPage = 1;
				loadProspects();
			}
		}
	}

	function toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		currentPage = 1;
		loadProspects();
	}

	// Handle select change from native select
	function handleNativeSortChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		handleSortChange(target.value);
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.custom-select')) {
			isDropdownOpen = false;
		}
	}

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isDropdownOpen = false;
		}
	}

	// Add click outside listener
	$effect(() => {
		if (isDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
			return () => {
				document.removeEventListener('click', handleClickOutside);
				document.removeEventListener('keydown', handleKeydown);
			};
		}
	});
</script>


<svelte:window bind:innerWidth />
<div class={`
	max-h-fit overflow-auto p-6 bg-white border-black border-[5px] relative mb-7 min-h-dvh md:shadow-section-shadow md:rotate-[0.3deg]
	${shouldtakeHalfScreen ? "max-w-[60%]" : "max-w-[880px]"} 
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

	<!-- Search bar on its own row -->
	<div class="mb-4">
		<Searchbar bind:value={searchInput} placeholder="Search Prospect" />
	</div>

	<!-- Sort and position filters row -->
	<div class="flex flex-col gap-5 lg:flex-row mb-4">
		<div class="flex gap-2">
			<!-- Custom Neo-Brutalist Select Dropdown -->
			<div class="relative w-[180px] custom-select">
				<button
					onclick={() => isDropdownOpen = !isDropdownOpen}
					class="w-full p-4 border-black border-[3px] bg-white text-black font-bold shadow-button-shadow focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] hover:bg-accent hover:text-black uppercase cursor-pointer transition-all duration-100 ease-in-out text-left flex justify-between items-center"
				>
					<span>{prospectSortOptions.find(option => option.value === sortBy)?.label === verbeekJoke ? 'Height' : prospectSortOptions.find(option => option.value === sortBy)?.label  || 'Sort by'}</span>
					<IconPlaceholder name="arrow-down" class="size-4 {isDropdownOpen ? 'rotate-180' : ''} transition-transform duration-100" />
				</button>
				
				{#if isDropdownOpen}
					<div class="absolute top-full left-0 w-full mt-1 bg-white border-black border-[3px] shadow-button-shadow z-50 animate-in fade-in duration-100">
						{#each prospectSortOptions as sortOption (sortOption.value)}
							<button
								onclick={() => {
									handleSortChange(sortOption.value);
									isDropdownOpen = false;
								}}
								class="w-full p-4 text-left font-bold uppercase cursor-pointer transition-all duration-100 ease-in-out hover:bg-accent hover:text-black hover:translate-x-[2px] hover:shadow-none border-b border-black last:border-b-0 active:translate-x-[2px] active:shadow-none {sortBy === sortOption.value ? 'bg-accent text-black shadow-none translate-x-[2px]' : 'bg-white text-black'}"
							>
								{sortOption.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<Button
				onclick={toggleSortOrder}
				variant="outline"
				size="md"
				shadow="md"
				class="flex items-center gap-1"
			>
				{#if sortOrder === 'asc'}
					<IconPlaceholder name="arrow-up" class="size-4" />
					<span>Asc</span>
				{:else}
					<IconPlaceholder name="arrow-down" class="size-4" />
					<span>Desc</span>
				{/if}
			</Button>
		</div>
		<MultipleSelect bind:sortFilter sortPosition={sortByPosition} />
	</div>

	{#if isLoading}
		<div class={`mb-12 grid ${innerWidth < 1001 ? 'grid-cols-1 justify-center' : 'grid-cols-2'} justify-between gap-6`}>
			{#each Array(12) as _, i}
				<ProspectCardSkeleton />
			{/each}
		</div>
	{:else}
		<div class={`mb-12 grid ${innerWidth < 1001 ? 'grid-cols-1 mx-auto' : 'grid-cols-2'} justify-between gap-6`}>
			{#each displayProspects as prospect}
				<ProspectCard {prospect} />
			{/each}

			{#if displayProspects.length === 0}
				<div class="col-span-full text-center py-8">
					<p class="text-lg font-bold">No prospects found</p>
					{#if dev} 
					<p class="text-sm text-gray-600">
						API Response: {prospectsResponse.prospects.length} prospects
						<br>
						Display: {displayProspects.length} prospects
						<br>
						Total: {prospectsResponse.pagination.totalCount}
					</p>
					{/if}
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
							<IconPlaceholder name="chevron-left" class="size-4" />
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
							<IconPlaceholder name="chevron-right" class="size-4" />
						</Pagination.NextButton>
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
		

		<!-- <div class="text-center mt-2 text-sm text-gray-600">
			Showing {displayProspects.length} prospects 
			({prospectsResponse.prospects.length} from API)
			of {prospectsResponse.pagination.totalCount} total
			(Page {prospectsResponse.pagination.currentPage} of {prospectsResponse.pagination.totalPages})
		</div> -->
	</div>
</div>
