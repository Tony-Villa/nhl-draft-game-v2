<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';
	import SliderSwitch from '$lib/components/SliderSwitch.svelte';

	const {
		data
	}: {
		data: any;
	} = $props();

	let selectedTab = $state('prospects');
	let innerWidth = $state(0);

	const switchScreens = (tab: string) => {
		selectedTab = tab;
	};

	// console.log(data);
</script>

<svelte:window bind:innerWidth />
<h1 class="text-center text-6xl font-bold uppercase mb-10">draft center</h1>
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
<div class="h-15 fixed bottom-0 flex w-full justify-center bg-[#FFF4E8] md:hidden lg:hidden">
	<SliderSwitch bind:selectedTab switchVariable={switchScreens} />
</div>
