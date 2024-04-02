<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import type { PositionFilter } from '$lib/types';
	import MultipleSelect from './MultipleSelect.svelte';
	import ProspectCard from './ProspectCard.svelte';
	import Searchbar from './Searchbar.svelte';

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

<div class="flex flex-[4] flex-wrap flex-col gap-2 pb-4">
	<!-- <h2>Prospects</h2> -->
	<div class="flex flex-col gap-2 md:flex-row lg:flex-row">
		<Searchbar bind:value={searchInput} placeholder="Search Prospect" />
		<MultipleSelect bind:sortFilter sortPosition={sortByPosition} />
	</div>
	<div class="flex flex-wrap justify-between gap-2 mb-12">
		{#each prospectList.prospects as prospect}
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


