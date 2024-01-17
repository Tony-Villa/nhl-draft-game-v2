<script lang="ts">
	import ProspectCard from './ProspectCard.svelte';
	const { draftEngine } = $props();

	// console.log(draftEngine.topProspects);
</script>

<h2>Prospects</h2>
<div class="prospect-container">
	{#each draftEngine.topProspects as prospect}
		<ProspectCard {prospect} draftProspect={draftEngine.addProspectToBoard} />
	{/each}
</div>

<style lang="postcss">
	.prospect-container {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>
