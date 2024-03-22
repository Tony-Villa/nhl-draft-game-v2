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
<div class=" flex gap-5 px-2">
	{#if innerWidth < 768}
		<div class="w-full pb-10">
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
