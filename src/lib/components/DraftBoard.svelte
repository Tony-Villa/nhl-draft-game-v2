<script lang="ts">
	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser } from '$lib/global-state/user-state.svelte';
	import Close from '$lib/icons/Close.svelte';
	import type { Prospect } from '$lib/types';
	import Button from './Button.svelte';
	import Card from './Card.svelte';
	import { Popover } from 'flowbite-svelte';
	import { dev } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { seedDb } from '$lib/helpers/seed-db';
	import { submitDraftBoard } from '$lib/helpers/submit-draft-board';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';

	let {draftType, nhlBoard}: {
		draftType: 'user' | 'nhl';
		nhlBoard?: any;
	} = $props()

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();
	const draftState = getDraftState();
	// const pointSystem = getPointsSystem()
	let draftBoardContainerWidth = $state(0)

	let nhlDraftBoard = $state(nhlBoard)


	function removeProspect(prospect: Prospect, position: number) {
		draftSystem.removeProspectFromBoard(prospect, position);
		
		// Update draft state and localStorage (same as in ProspectCard)
		draftState.updateDraftStatus(false);

		if(!currentUser.user){
			localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
		}
	}

	function seed() {
		draftState.currentState = 'started'
			
		seedDb({
			prospects: draftSystem.prospects, 
			draftboard: draftSystem.draftBoard,
		})

	}

	let draftBoard = $derived(draftType === 'user' ? draftSystem.draftBoard : draftSystem?.nhlDraftBoard)

	// $inspect('NHL BOARD -- INSIDE DRAFT BOARD: ', draftSystem?.nhlDraftBoard)
</script>

<div bind:clientWidth={draftBoardContainerWidth} class={`
	flex-1 max-h-fit p-6 bg-white border-black border-[5px] relative mb-7 md:shadow-section-shadow z-0 md:-rotate-[0.3deg]
`}>
	<h2 class={`
	text-3xl font-extrabold uppercase tracking-[-1px] relative inline-block mb-7
	after:content-[''] after:absolute after:left-0 after:bottom-[-5px] after:w-full after:h-[5px] after:bg-primary
	`}>
		{#if draftType === 'user'}
			Your Draft Board
		{:else}
			NHL Draft Board
		{/if}
	</h2>
	{#if draftType === 'user'}
	<div class="flex items-end justify-between gap-3 pr-3">
		{#if !currentUser?.user}
			<div class="mx-auto text-lg mb-5 p-4 border-dashed border-[3px] border-gray">
				<p class="text-gray font-semibold md:text-lg">Sign in to submit your draft!</p>
			</div>
		{/if}

		{#if draftState.currentState === "open" && currentUser?.user}
		<div class="flex flex-col w-[60%] gap-2 mx-auto mb-7">
			<Button onclick={() => submitDraftBoard({
				draftboard: draftSystem.draftBoard,
				user: currentUser.user,
				draftState,
				draftSystem
			})} 
			id='submit-draft'
			class='rotate-[1.5deg] text-lg'
			disabled={!currentUser?.user || draftState?.isDraftLocked}>
				Submit Draft
			</Button>
		</div>
		<!-- TODO: figure out seed maybe a script instead of this button -->
			<!-- {#if dev}
				<Button onclick={seed} 
				id='seed'
				class="py-2">
					Seed DB
				</Button>
			{/if} -->
		{/if}


		{#if draftState.isDraftLocked }
			<Popover
				class="px-3 text-semibold font-light bg-orange-200 rounded-lg shadow-brut-shadow-sm outline-none border-black border-2" 
				triggeredBy="#submit-draft">
					Your draft hasn't changed
			</Popover>
		{/if}
	</div>
	{/if}

	{#if draftType === 'nhl'}
		<p class="font-bold md:text-lg">NHL Draft</p>
	{/if}

	<div class={`draft-card-container mb-16 flex flex-wrap justify-center gap-2 -z-50 `}>
		{#each draftBoard || [] as position}
			<Card size="sm" class={`draft-card -z-20 flex py-5 items-center overflow-hidden ${draftBoardContainerWidth > 500 ? 'basis-[48%]' : 'basis-[100%]'} max-[430px]:basis-[100%]`}>
				<div class="flex items-center justify-between w-full">
					<div  class="flex items-center ">
						<div class="after:content-[''] after:absolute {position?.draftPosition < 10 ? 'after:left-[35px]' : 'after:left-[50px]'} after:bottom-3 after:w-[5px] after:h-3/4 after:bg-primary">
							<h2 class="text-black mx-auto font-extrabold text-[28px] mr-2">{position.draftPosition}</h2>
						</div>
						<div class="absolute -z-10 {position?.teamLogo && position.teamLogo.toLowerCase().includes('pit') && 'top-[-80px]'} ">
							<div class="relative">
								<img class="h-[300px] w-[300px] opacity-15 " src={position.teamLogo} alt="" />
								{#if position?.from}
									<img class="h-6 w-6 absolute right-0 top-[64%]" src={position.from} alt=""/>
								{/if}
							</div>
						</div>
					</div>
					{#if position.prospect}
					<div in:fade class='flex flex-1 justify-between items-center z-10'>
						<div class="flex flex-col ml-3 ">
							<p class="ml-2 text-xl font-extrabold">{position?.prospect?.name && position?.prospect?.name.split(' ')[0]}</p>
							<p class="ml-2 text-xl font-extrabold">{position?.prospect?.name && position?.prospect?.name.split(' ')[1]}</p>
						</div>
						{#if draftState.currentState === 'open'}
						<button
							onclick={() => removeProspect(position.prospect as Prospect, position.draftPosition)}
							class="ml-auto"
						>
						<Close size={24} />
					</button>
					{/if}
					{#if draftType !== 'nhl'}
						{#if draftState.currentState === 'started' || draftState.currentState === 'finalized'}
							<div class="flex flex-col justify-center items-center gap-0">
								<p class="text-sm">Points</p>
								<h3 class="text-lg font-bold">{position?.points || 10}</h3>
							</div>
						{/if}
					{/if}
					</div>
					{/if}
				</div>
			</Card>
		{/each} 
	</div>
</div>