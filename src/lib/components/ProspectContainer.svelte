<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import type { PositionFilter } from '$lib/types';
	import MultipleSelect from './MultipleSelect.svelte';
	import ProspectCard from './ProspectCard.svelte';
	import Searchbar from './Searchbar.svelte';

	import ChevronLeft from "@lucide/svelte/icons/chevron-left";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import * as Pagination from "$lib/components/ui/pagination/index.js";
	import { buttonOptions } from './Button.options';

	const prospectList = getDraftSystem();

	let searchInput: string = $state('');
	let positions: string[] = $state([]);
	let derivedPositionRegex = $derived.by(() => {
		let p = [...positions];
		
		if (p.includes('C') || p.includes('LW') || p.includes('RW')) {
			p.push('F');
		}
		return new RegExp(`\\b(${p.join('|')})\\b`);
	});
	
	
	let sortFilter = $state({
		C: false,
		LW: false,
		RW: false,
		D: false,
		G: false
	});
	
	
	let curPage = $state(1)
	const itemsPerPage = 12


	let filteredProspects = $derived.by(() => {
		return prospectList.prospects.filter(prospect => {
			if(prospect.drafted) return false
			if(searchInput && !prospect.name?.toLowerCase()?.includes(searchInput.toLowerCase())) return false
			if(derivedPositionRegex && !derivedPositionRegex.test(prospect?.position ?? '')) return false
			
			return true
		})
	})
	
	const currentProspects = $derived.by(() => {
		return filteredProspects.slice(
			(curPage - 1) * itemsPerPage,
			curPage * itemsPerPage
		);
	})

	let maxPage = $derived(Math.ceil( filteredProspects.length / itemsPerPage ))


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
	};
</script>

<div class={`
max-h-fit overflow-auto p-6 bg-white border-black border-[5px] relative mb-7 md:shadow-section-shadow md:rotate-[0.3deg]
max-w-[880px] 
flex flex-[4] flex-col flex-wrap gap-2 pb-4`
}>

	<div class="flex flex-1 w-full justify-between">

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
	<div class="mb-12 grid grid-cols-1 md:grid-cols-2 justify-between gap-6 md:justify-start">
		{#each currentProspects as prospect}
				<ProspectCard {prospect} />
		{/each}


	</div>
	<div class="w-full mx-auto mb-4">
		<Pagination.Root count={filteredProspects.length} perPage={itemsPerPage} siblingCount={1} >
			{#snippet children({ pages, currentPage })}
				<Pagination.Content>
					<Pagination.Item>
						<Pagination.PrevButton class={`${buttonOptions({variant: 'outline'})} rounded-none mr-2`} onclick={() => {
								window.scrollTo(0, 0);
								curPage = currentPage - 1
							}}>
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
							<Pagination.Item >
								<Pagination.Link {page} isActive={currentPage === page.value} onclick={() => {
										window.scrollTo(0, 0);
										curPage = page.value
									}}>
									{page.value}
								</Pagination.Link>
							</Pagination.Item>
						{/if}
					{/each}
					<Pagination.Item>
						<Pagination.NextButton class={`${buttonOptions({variant: 'outline'})} rounded-none`} onclick={() => {
								window.scrollTo(0, 0);
								curPage = currentPage + 1
							}}>
							<span class="hidden sm:block">Next</span>
							<ChevronRight class="size-4" />
						</Pagination.NextButton>
					</Pagination.Item>
				</Pagination.Content>
			{/snippet}
		</Pagination.Root>
	</div>
</div>


<!-- {#each tempProspectsList as prospect} 
	{#if !prospect.drafted && positions.length === 0 && (prospect?.name ?? '')
			.toLowerCase()
			.includes(searchInput.toLowerCase())}
		<ProspectCard {prospect} />
	{:else if positions.length > 0 && !prospect.drafted && (prospect?.name ?? '')
			.toLowerCase()
			.includes(searchInput.toLowerCase()) && derivedPositionRegex.test(prospect?.position ?? '')}
		<ProspectCard {prospect} />
	{/if}
{/each} -->