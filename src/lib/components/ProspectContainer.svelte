<script lang="ts">
	import type { DraftSystem } from '$lib/globalState/prospects/draftSystem.svelte';
	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import type { PositionFilter } from '$lib/types';
	import MultipleSelect from './MultipleSelect.svelte';
	import ProspectCard from './ProspectCard.svelte';
	import Searchbar from './Searchbar.svelte';

	const prospectList = getDraftSystem();

	let searchInput: string = $state('');

	let sortFilter = $state({
		C: false,
		LW: false,
		RW: false,
		D: false,
		G: false
	});

	const sortByPosition = (options: PositionFilter, option: string) => {
		(options as PositionFilter)[option] = !(options as PositionFilter)[option];
	};

	// $effect(() => {
	// 	console.log(sortFilter);
	// });
</script>

<h2>Prospects</h2>
<div class="prospect-options">
	<Searchbar bind:value={searchInput} placeholder="Search Prospect" />

	<MultipleSelect bind:sortFilter sortPosition={sortByPosition} />
</div>
<div class="prospect-container">
	{#each prospectList.prospects as prospect}
		{#if !prospect.drafted && (prospect?.name ?? '')
				.toLowerCase()
				.includes(searchInput.toLowerCase())}
			<ProspectCard {prospect} />
		{/if}
	{/each}
</div>

<style lang="postcss">
	.prospect-container {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>
