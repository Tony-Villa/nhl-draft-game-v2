<script lang="ts">
	import ProspectCard from './ProspectCard.svelte';
	const { draftEngine } = $props();

	// console.log(draftEngine.topProspects);
</script>

<h2>Prospects</h2>
<div class="prospect-container">
	{#each draftEngine.shownProspects as prospect}
		{#if !prospect.drafted}
			<ProspectCard
				{prospect}
				board={draftEngine.draftBoard}
				draftProspect={draftEngine.addProspectToBoard}
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
