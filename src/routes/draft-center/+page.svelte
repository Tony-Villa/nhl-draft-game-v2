<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';

	const {
		data
	}: {
		data: any;
	} = $props();

	let selectedTab = $state('prospects');
	let innerWidth = $state(0);

	// console.log(data);
</script>

<svelte:window bind:innerWidth />
<h1 class="text-center text-6xl font-bold uppercase">draft center</h1>
<div class="draft-center px-2">
	{#if innerWidth < 640}
		<div class="pb-10">
			{#if selectedTab === 'draftboard'}
				<DraftBoard />
			{:else if selectedTab === 'prospects'}
				<ProspectContainer />
			{/if}
		</div>
	{:else}
		<DraftBoard />
		<ProspectContainer />
	{/if}
</div>
<div
	class="fixed bottom-0 flex h-10 w-full flex-row justify-around bg-orange-600 md:hidden lg:hidden"
>
	<button onclick={() => (selectedTab = 'draftboard')}>Draft Board</button>
	<button onclick={() => (selectedTab = 'prospects')}>Prospects</button>
</div>

<style lang="postcss">
	.draft-center {
		display: flex;
		gap: 20px;

		@media screen and (max-width: 768px) {
			flex-direction: column;
		}
	}
	.draft-board {
		flex: 1;
	}
	.prospects {
		flex: 3;
	}
</style>
