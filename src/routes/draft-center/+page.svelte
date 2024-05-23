<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';
	import SliderSwitch from '$lib/components/SliderSwitch.svelte';
	import { getDraftState } from '$lib/globalState/draftState.svelte';

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

	const draftState = getDraftState();

	// console.log(data);
</script>

<svelte:window bind:innerWidth />
<div class="mx-auto max-w-screen-2xl">
	<h1 class="mb-12 text-center text-6xl font-bold uppercase">draft center</h1>
	{#if !draftState.nhlDraftStarted}
	<div class=" flex gap-5 px-2">
		{#if innerWidth < 768}
			<div class="w-full pb-10">
				{#if selectedTab === 'draftboard'}
					<DraftBoard draftType="user" />
				{:else if selectedTab === 'prospects'}
					<ProspectContainer />
				{/if}
			</div>
		{:else}
			<DraftBoard draftType="user" />
			<ProspectContainer />
		{/if}
	</div>
	<div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-2 bg-[#FFF4E8] shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
	>
		<SliderSwitch switchVariable={switchScreens} left={'prospects'} right={'draftboard'} />
	</div>
	{:else}
	<div class=" flex gap-5 px-2">
		{#if innerWidth < 768}
			<div class="w-full pb-10">
				{#if selectedTab === 'draftboard'}
					<DraftBoard draftType="user" />
				{:else if selectedTab === 'prospects'}
				<DraftBoard draftType="nhl" />
				{/if}
			</div>
		{:else}
			<DraftBoard draftType="user" />
			<DraftBoard draftType="nhl" />
		{/if}
		</div>
		<div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-2 bg-[#FFF4E8] shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
		>
		<SliderSwitch switchVariable={switchScreens} left={'prospects'} right={'draftboard'} />
		</div>
	{/if}
</div>
