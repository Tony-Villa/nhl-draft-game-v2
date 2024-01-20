<script lang="ts">
	import type { DraftSystem } from '$lib/stores/prospects/draftSystem.svelte';
	import ProspectCard from './ProspectCard.svelte';
	const { draftEngine } = $props();

	// console.log(draftEngine.topProspects);
</script>

<h2>Prospects</h2>
<div class="prospect-container">
	{#each (draftEngine as DraftSystem)?.shownProspects as prospect}
		{#if !prospect.drafted}
			<ProspectCard
				{prospect}
				board={(draftEngine as DraftSystem)?.draftBoard}
				draftProspect={(draftEngine as DraftSystem)?.addProspectToBoard}
			/>
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
