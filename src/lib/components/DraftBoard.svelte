<script lang="ts">
	import { getDraftState } from '$lib/globalState/draftState.svelte';
	import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/userState.svelte';
	import Close from '$lib/icons/Close.svelte';
	import type { DraftBoard, Prospect } from '$lib/types';
	import Button from './Button.svelte';
	import Card from './Card.svelte';
	import { Popover } from 'flowbite-svelte';
	import { dev } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { seedDb } from '$lib/helpers/seed-db';
	import { submitDraftBoard } from '$lib/helpers/submit-draft-board';

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

<div bind:clientWidth={draftBoardContainerWidth} class={`draft-board flex w-full flex-[2] flex-col gap-2 min-[950px]:min-w-[450px]`}>

	{#if draftType === 'user'}
	<div class="flex items-end justify-between gap-3 pr-3">
		<div class="flex flex-col">
			{#if !currentUser?.user}
				<p class="font-bold md:text-lg">Please sign in to submit your draft</p>
				{:else}
				<p class="font-bold md:text-lg">Your Draft</p>
			{/if}
		</div>

		{#if draftState.currentState === "open"}
		<div class="flex flex-col gap-2">
			<Button onclick={() => submitDraftBoard({
				draftboard: draftSystem.draftBoard,
				user: currentUser.user,
				draftState
			})} 
			id='submit-draft'
			class="py-2" 
			disabled={!currentUser?.user || draftState?.isDraftLocked}>
				Submit Draft
			</Button>
		</div>
		<!-- remove -->
			{#if dev}
				<Button onclick={seed} 
				id='seed'
				class="py-2">
					Seed DB
				</Button>
			{/if}
			<!-- end remove -->
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

	<div class={`draft-card-container mb-16 flex flex-wrap justify-center gap-2 `}>
		{#each draftBoard || [] as position}
			<Card variant="small" class={`draft-card ${draftBoardContainerWidth > 300 ? 'basis-[48%]' : 'basis-[100%]'} max-[430px]:basis-[100%]`}>
				<div class="flex items-center px-2 py-2">
					<h2>{position.draftPosition}</h2>
					<div class="relative">
						<img class="h-[50px] w-[50px] z-10" src={position.teamLogo} alt="" />
						{#if position?.from}
							<img class="h-6 w-6 absolute right-0 top-[64%]" src={position.from} alt=""/>
						{/if}
					</div>
					{#if position.prospect}
					<div in:fade class='flex flex-1 justify-between items-center'>
						<p class="ml-2 font-bold">{position?.prospect?.name}</p>
						{#if draftState.currentState === 'open'}
						<button
							onclick={() => removeProspect(position.prospect as Prospect, position.draftPosition)}
							class="ml-auto"
						>
						<Close size={24} />
					</button>
					{/if}
					{#if  draftType !== 'nhl' && draftState.currentState === 'started' || draftState.currentState === 'finalized'}
						<div class="flex flex-col justify-center items-center gap-0">
							<p class="text-sm">Points</p>
							<h3 class="text-lg font-bold">{position?.points || 0}</h3>
						</div>
					{/if}
					</div>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
</div>