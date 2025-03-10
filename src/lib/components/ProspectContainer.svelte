<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import type { PositionFilter } from '$lib/types';
	import MultipleSelect from './MultipleSelect.svelte';
	import ProspectCard from './ProspectCard.svelte';
	import Searchbar from './Searchbar.svelte';

	const prospectList = getDraftSystem();

	const tempProspectsList = prospectList.prospects.slice(0,12);

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
max-h-fit overflow-auto p-6 bg-white border-black border-[5px] relative mb-7 shadow-section-shadow rotate-[0.1deg] md:rotate-[0.3deg]
max-w-[880px] 
flex flex-[4] flex-col flex-wrap gap-2 pb-4`
}>

	<h2 class={`
		text-3xl font-extrabold uppercase tracking-[-1px] relative inline-block mb-7
		after:content-[''] after:absolute after:left-0 after:bottom-[-5px] after:w-[40%] after:h-[5px] after:bg-primary
		`}>
	Available Prospects	
	</h2>

	<div class="flex flex-col gap-5 lg:flex-row mb-4">
		<Searchbar bind:value={searchInput} placeholder="Search Prospect" />
		<MultipleSelect bind:sortFilter sortPosition={sortByPosition} />
	</div>
	<div class="mb-12 grid grid-cols-1 md:grid-cols-2 justify-between gap-6 md:justify-start">
		<!-- TODO: don't forget to switch back to prospectList.prospects here after testing -->
		{#each tempProspectsList as prospect}
			{#if !prospect.drafted && positions.length === 0 && (prospect?.name ?? '')
					.toLowerCase()
					.includes(searchInput.toLowerCase())}
				<ProspectCard {prospect} />
			{:else if positions.length > 0 && !prospect.drafted && (prospect?.name ?? '')
					.toLowerCase()
					.includes(searchInput.toLowerCase()) && derivedPositionRegex.test(prospect?.position ?? '')}
				<ProspectCard {prospect} />
			{/if}
		{/each}
	</div>
</div>
