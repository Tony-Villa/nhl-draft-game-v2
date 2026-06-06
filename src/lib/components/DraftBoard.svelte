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

	let {
		draftType,
		nhlBoard
	}: {
		draftType: 'user' | 'nhl';
		nhlBoard?: any;
	} = $props();

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();
	const draftState = getDraftState();
	// const pointSystem = getPointsSystem()
	let draftBoardContainerWidth = $state(0);

	function removeProspect(prospect: Prospect, position: number) {
		draftSystem.removeProspectFromBoard(prospect, position);

		// Update draft state and localStorage (same as in ProspectCard)
		draftState.updateDraftStatus(false);

		if (!currentUser.user) {
			localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
		}
	}

	function seed() {
		draftState.currentState = 'started';

		seedDb({
			prospects: draftSystem.prospects,
			draftboard: draftSystem.draftBoard
		});
	}

	let draftBoard = $derived(
		draftType === 'user' ? draftSystem.draftBoard : draftSystem?.nhlDraftBoard
	);

	// $inspect('NHL BOARD -- INSIDE DRAFT BOARD: ', draftSystem?.nhlDraftBoard)
</script>

<div
	bind:clientWidth={draftBoardContainerWidth}
	class={`
	md:shadow-section-shadow relative z-0 mb-7 max-h-fit flex-1 border-[5px] border-black bg-white p-6 ${draftState.currentState === 'open' ? 'md:-rotate-[0.3deg]' : ''}
`}
>
	<h2
		class={`
	after:bg-primary relative mb-7 inline-block text-3xl font-extrabold tracking-[-1px]
	uppercase after:absolute after:bottom-[-5px] after:left-0 after:h-[5px] after:w-full after:content-['']
	`}
	>
		{#if draftType === 'user'}
			Your Draft Board
		{:else}
			NHL Draft Board
		{/if}
	</h2>
	{#if draftType === 'user'}
		<div class="flex items-end justify-between gap-3 pr-3">
			{#if !currentUser?.user && draftState.currentState !== 'mock'}
				<div class="border-gray mx-auto mb-5 border-[3px] border-dashed p-4 text-lg">
					<p class="text-gray font-semibold md:text-lg">Sign in to submit your draft!</p>
				</div>
			{/if}

			{#if draftState.currentState === 'open' && currentUser?.user}
				<div class="mx-auto mb-7 flex w-[60%] flex-col gap-2">
					<Button
						onclick={() =>
							submitDraftBoard({
								draftboard: draftSystem.draftBoard,
								user: currentUser.user,
								draftState,
								draftSystem
							})}
						id="submit-draft"
						class="rotate-[1.5deg] text-lg"
						disabled={!currentUser?.user || draftState?.isDraftLocked}
					>
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

			{#if draftState.isDraftLocked}
				<Popover
					class="text-semibold shadow-brut-shadow-sm rounded-lg border-2 border-black bg-orange-200 px-3 font-light outline-none"
					triggeredBy="#submit-draft"
				>
					Your draft hasn't changed
				</Popover>
			{/if}
		</div>
	{/if}

	<div class={`draft-card-container mb-16 flex flex-wrap justify-center gap-2`}>
		{#each draftBoard || [] as position}
			<Card
				size="sm"
				class={`draft-card flex items-center py-5 ${draftType === 'nhl' && 'min-h-[102px]'} overflow-hidden ${draftBoardContainerWidth > 500 ? 'basis-[48%]' : 'basis-[100%]'} relative max-[430px]:basis-[100%]`}
			>
				<div class="relative z-10 flex w-full items-center justify-between">
					<div class="flex items-center">
						<div
							class="after:absolute after:content-[''] {position?.draftPosition < 10
								? 'after:left-[25px]'
								: 'after:left-[40px]'} after:bg-primary after:bottom-1 after:h-full after:w-[5px]"
						>
							<h2 class="mx-auto mr-2 text-[28px] font-extrabold text-black">
								{position.draftPosition}
							</h2>
						</div>
						<div
							class="absolute -z-10 {position?.teamLogo &&
								position.teamLogo.toLowerCase().includes('pit') &&
								'top-[-80px]'} "
						>
							<div class="relative">
								<img class="h-[300px] w-[300px] opacity-15" src={position.teamLogo} alt="" />
								{#if position?.from}
									<img class="absolute top-[64%] right-0 h-6 w-6" src={position.from} alt="" />
								{/if}
							</div>
						</div>
					</div>
					{#if position.prospect}
						<div in:fade class="flex flex-1 items-center justify-between">
							<div class="ml-3 flex flex-col">
								<p class="ml-2 text-xl font-extrabold">
									{position?.prospect?.name && position?.prospect?.name.split(' ')[0]}
								</p>
								<p class="ml-2 text-xl font-extrabold">
									{position?.prospect?.name &&
										position?.prospect?.name.split(' ').slice(1).join(' ')}
								</p>
							</div>
							{#if draftState.currentState === 'open'}
								<button
									onclick={() =>
										removeProspect(position.prospect as Prospect, position.draftPosition)}
									class="relative z-30 ml-auto rounded-full p-2 transition-colors hover:bg-gray-100"
								>
									<Close size={24} />
								</button>
							{/if}
							{#if draftType !== 'nhl'}
								{#if draftState.currentState === 'started' || draftState.currentState === 'finalized'}
									<div class="flex flex-col items-center justify-center gap-0">
										<p class="text-sm">Points</p>
										<h3 class="text-lg font-bold">{position?.points || 0}</h3>
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
