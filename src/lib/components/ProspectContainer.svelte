<script lang="ts">
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import type { PositionFilter } from '$lib/types';
	import MultipleSelect from './MultipleSelect.svelte';
	import ProspectCard from './ProspectCard.svelte';
	import ProspectCardSkeleton from './ProspectCardSkeleton.svelte';
	import Searchbar from './Searchbar.svelte';
	import { getProspects } from '$lib/remote/prospects.remote';
	import type { ProspectsPage } from '$lib/prospects/types';
	import type { Prospect } from '$lib/types';
	import { flushSync } from 'svelte';

	import IconPlaceholder from '$lib/components/IconPlaceholder.svelte';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import Button from './Button.svelte';
	import { buttonOptions } from './Button.options';

	let { year }: { year: number } = $props();

	const prospectSystem = getDraftSystem();

	const verbeekJoke = `Verbeek's only important stat (Height)`;

	const prospectSortOptions = [
		{ label: 'Rank', value: 'rank' },
		{ label: verbeekJoke, value: 'height' },
		{ label: 'Age', value: 'age' },
		{ label: 'Name', value: 'name' }
	];

	// Filters and pagination
	let searchInput: string = $state('');
	let positions: string[] = $state([]);
	let currentPage = $state(1);
	let sortBy: 'rank' | 'name' | 'height' | 'age' = $state('rank');
	let sortOrder: 'asc' | 'desc' = $state('asc');
	let isDropdownOpen = $state(false);
	let debouncedSearch = $state('');
	let prospectContainer: HTMLDivElement;

	const itemsPerPage = 12;
	const scrollBuffer = 240;

	let innerWidth = $state(0);
	let shouldtakeHalfScreen = $derived.by(() => {
		return innerWidth < 1250 && innerWidth > 768;
	});

	let derivedPositionFilter = $derived.by(() => {
		let p = [...positions];

		if (p.includes('C') || p.includes('LW') || p.includes('RW')) {
			p.push('F');
		}
		return p.length > 0 ? p.join(',') : '';
	});

	const prospectsQuery = $derived(
		getProspects({
			page: currentPage,
			limit: itemsPerPage,
			search: debouncedSearch,
			position: derivedPositionFilter,
			sortBy,
			sortOrder,
			year
		})
	);

	let sortFilter: PositionFilter = $state({
		C: false,
		LW: false,
		RW: false,
		D: false,
		G: false
	});

	function withDraftStatus(prospects: Prospect[]) {
		prospectSystem.temporaryDraftedIds.size;
		prospectSystem.permanentDraftedIds.size;

		if (prospects.length === 0) {
			return [];
		}

		try {
			return prospects.map((prospect) => {
				const isDrafted = prospect.id ? prospectSystem.isDrafted(prospect.id) : false;
				const isTemporary = prospect.id ? prospectSystem.isTemporarilyDrafted(prospect.id) : false;
				const isPermanent = prospect.id
					? prospectSystem.permanentDraftedIds.has(prospect.id)
					: false;

				return {
					...prospect,
					isDrafted,
					isTemporary,
					isPermanent
				};
			});
		} catch (error) {
			return [];
		}
	}

	let searchTimeout: number | undefined;

	$effect(() => {
		const nextSearch = searchInput.trim();

		if (searchTimeout) clearTimeout(searchTimeout);

		searchTimeout = Number(
			setTimeout(() => {
				debouncedSearch = nextSearch;
				currentPage = 1;
			}, 300)
		);

		return () => clearTimeout(searchTimeout);
	});

	const sortByPosition = (option: string) => {
		const nextSortFilter = {
			...sortFilter,
			[option]: !sortFilter[option]
		};

		// Commit the pressed state before changing the remote query arguments.
		flushSync(() => {
			sortFilter = nextSortFilter;
		});

		positions = Object.entries(nextSortFilter)
			.filter(([, selected]) => selected)
			.map(([position]) => position);
		currentPage = 1;
	};

	function handlePageChange() {
		let containerTop = 0;
		let element: HTMLElement | null = prospectContainer;

		while (element) {
			containerTop += element.offsetTop;
			element = element.offsetParent as HTMLElement | null;
		}

		window.scrollTo({
			top: Math.max(0, containerTop - scrollBuffer),
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
		});
	}

	function handleSortChange(value: string | undefined) {
		if (value && (value === 'rank' || value === 'name' || value === 'height' || value === 'age')) {
			if (value === 'height') {
				sortBy = value;
				sortOrder = 'desc'; // Default to descending for height
				currentPage = 1;
			} else {
				sortBy = value;
				sortOrder = 'asc'; // Default to ascending for other fields
				currentPage = 1;
			}
		}
	}

	function toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		currentPage = 1;
	}

	function retryProspects(reset: () => void) {
		void prospectsQuery.refresh();
		reset();
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
<div
	bind:this={prospectContainer}
	data-prospect-container
	class={`
	md:shadow-section-shadow relative mb-7 max-h-fit min-h-dvh overflow-auto border-[5px] border-black bg-white p-6 md:rotate-[0.3deg]
	${shouldtakeHalfScreen ? 'max-w-[60%]' : 'max-w-[880px]'}
	flex flex-[4] flex-col flex-wrap gap-2 pb-4`}
>
	<div class="flex w-full justify-between">
		<h2
			class={`
			after:bg-primary relative mb-7 inline-block text-3xl font-extrabold tracking-[-1px]
			uppercase after:absolute after:bottom-[-5px] after:left-0 after:h-[5px] after:w-[40%] after:content-['']
			`}
		>
			Available Prospects
		</h2>
	</div>

	<!-- Search bar on its own row -->
	<div class="mb-4">
		<Searchbar bind:value={searchInput} placeholder="Search Prospect" />
	</div>

	<!-- Sort and position filters row -->
	<div class="mb-4 flex flex-col gap-5 lg:flex-row">
		<div class="flex gap-2">
			<!-- Custom Neo-Brutalist Select Dropdown -->
			<div class="custom-select relative w-[180px]">
				<button
					onclick={() => (isDropdownOpen = !isDropdownOpen)}
					class="shadow-button-shadow hover:bg-accent flex w-full cursor-pointer items-center justify-between border-[3px] border-black bg-white p-4 text-left font-bold text-black uppercase transition-all duration-100 ease-in-out hover:text-black focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none focus:outline-none"
				>
					<span
						>{prospectSortOptions.find((option) => option.value === sortBy)?.label === verbeekJoke
							? 'Height'
							: prospectSortOptions.find((option) => option.value === sortBy)?.label ||
								'Sort by'}</span
					>
					<IconPlaceholder
						name="arrow-down"
						class="size-4 {isDropdownOpen ? 'rotate-180' : ''} transition-transform duration-100"
					/>
				</button>

				{#if isDropdownOpen}
					<div
						class="shadow-button-shadow animate-in fade-in absolute top-full left-0 z-50 mt-1 w-full border-[3px] border-black bg-white duration-100"
					>
						{#each prospectSortOptions as sortOption (sortOption.value)}
							<button
								onclick={() => {
									handleSortChange(sortOption.value);
									isDropdownOpen = false;
								}}
								class="hover:bg-accent w-full cursor-pointer border-b border-black p-4 text-left font-bold uppercase transition-all duration-100 ease-in-out last:border-b-0 hover:translate-x-[2px] hover:text-black hover:shadow-none active:translate-x-[2px] active:shadow-none {sortBy ===
								sortOption.value
									? 'bg-accent translate-x-[2px] text-black shadow-none'
									: 'bg-white text-black'}"
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
		<MultipleSelect {sortFilter} onToggle={sortByPosition} />
	</div>

	<svelte:boundary>
		{@render prospectResults(await prospectsQuery)}

		{#snippet pending()}
			{@render prospectSkeletons()}
		{/snippet}

		{#snippet failed(error, reset)}
			<div
				class="shadow-button-shadow mb-12 border-[3px] border-black bg-white p-6 text-center"
				data-prospect-source="error"
			>
				<p class="text-lg font-bold">Unable to load prospects</p>
				<p class="mt-2 text-sm text-gray-600">Your draft board has not been changed.</p>
				<Button class="mt-4" onclick={() => retryProspects(reset)}>Try again</Button>
			</div>
		{/snippet}
	</svelte:boundary>
</div>

{#snippet prospectSkeletons()}
	<div
		class={`mb-12 grid ${innerWidth < 1001 ? 'grid-cols-1 justify-center' : 'grid-cols-2'} justify-between gap-6`}
		data-prospect-source="loading"
	>
		{#each Array(12) as _}
			<ProspectCardSkeleton />
		{/each}
	</div>
{/snippet}

{#snippet prospectResults(prospectsResponse: ProspectsPage)}
	{@const displayProspects = withDraftStatus(prospectsResponse.prospects)}
	<div data-prospect-source="remote">
		<div
			class={`mb-12 grid ${innerWidth < 1001 ? 'grid-cols-1 justify-center' : 'grid-cols-2'} justify-between gap-6`}
		>
			{#each displayProspects as prospect}
				<ProspectCard {prospect} />
			{/each}

			{#if displayProspects.length === 0}
				<div class="col-span-full py-8 text-center">
					<p class="text-lg font-bold">No prospects found</p>
				</div>
			{/if}
		</div>

		<div class="mx-auto mb-4 w-full">
			<Pagination.Root
				count={prospectsResponse.pagination.totalCount}
				perPage={itemsPerPage}
				siblingCount={1}
				bind:page={currentPage}
			>
				{#snippet children({
					pages,
					currentPage: pageCurrent
				}: {
					pages: any[];
					currentPage: number;
				})}
					<Pagination.Content onclickcapture={handlePageChange}>
						<Pagination.Item>
							<Pagination.PrevButton
								class={`${buttonOptions({ variant: 'outline' })} mr-2 rounded-none`}
								disabled={!prospectsResponse.pagination.hasPrevPage}
							>
								<IconPlaceholder name="chevron-left" class="size-4" />
								<span class="hidden sm:block">Previous</span>
							</Pagination.PrevButton>
						</Pagination.Item>
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link {page} isActive={pageCurrent === page.value}>
										{page.value}
									</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<Pagination.NextButton
								class={`${buttonOptions({ variant: 'outline' })} rounded-none`}
								disabled={!prospectsResponse.pagination.hasNextPage}
							>
								<span class="hidden sm:block">Next</span>
								<IconPlaceholder name="chevron-right" class="size-4" />
							</Pagination.NextButton>
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</div>
	</div>
{/snippet}
