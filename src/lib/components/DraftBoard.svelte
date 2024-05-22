<script lang="ts">
	import { getDraftState } from '$lib/globalState/draftState.svelte';
	import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/userState.svelte';
	import Close from '$lib/icons/Close.svelte';
	import type { Prospect, User } from '$lib/types';
	import Button from './Button.svelte';
	import Card from './Card.svelte';
	import { Popover } from 'flowbite-svelte';
	import { dev } from '$app/environment';
	import { fade } from 'svelte/transition';
	import { seedDb } from '$lib/helpers/seed-db';
	import { submitDraftBoard } from '$lib/helpers/submit-draft-board';

	let {draftType}: {
		draftType: 'user' | 'nhl'
	} = $props()

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();
	const draftState = getDraftState();
	let draftBoardContainerWidth = $state(0)


	function removeProspect(prospect: Prospect, position: number) {
		draftSystem.removeProspectFromBoard(prospect, position);
	}

	const draftBoard = draftType === 'user' ? draftSystem.draftBoard : []

</script>

<div bind:clientWidth={draftBoardContainerWidth} class="draft-board flex w-full flex-[2] flex-col gap-2 min-[950px]:min-w-[450px]">

	{#if draftType === 'user'}
	<div class="flex items-end justify-end gap-3 pr-3">
		{#if currentUser.user}
			<p class="font-bold md:text-lg">Welcome {`, ${(currentUser.user as User)?.name}` || ''}</p>
		{:else}
			<p class="font-bold md:text-lg">Please sign in to submit your draft</p>
		{/if}
		<Button onclick={() => submitDraftBoard({
			draftboard: draftSystem.draftBoard,
			user: currentUser.user,
			draftState
		})} 
		 id='submit-draft'
		 class="py-2" 
		 disabled={!currentUser.user || draftState.isDraftLocked}>
			Submit Draft
		</Button>
		{#if dev}
			<Button onclick={() => seedDb({
				prospects: draftSystem.prospects, draftboard: draftSystem.draftBoard
				})} 
			id='seed'
			class="py-2" 
			disabled={!currentUser.user || draftState.isDraftLocked}>
				Seed DB
			</Button>
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

	<div class="draft-card-container mb-16 flex flex-wrap justify-center gap-2">
		{#each draftBoard || [] as position}
			<Card variant="small" class={`draft-card ${draftBoardContainerWidth > 300 ? 'basis-[48%]' : 'basis-[100%]'} max-[430px]:basis-[100%]`}>
				<div class="flex items-center px-2 py-2">
					<h2>{position.draftPosition}</h2>
					<img class="h-[50px] w-[50px]" src={position.teamLogo} alt="" />
					{#if position.prospect}
					<div in:fade class='flex flex-1 justify-between'>
						<p class="ml-2 font-bold">{position?.prospect?.name}</p>
						<button
							onclick={() => removeProspect(position.prospect as Prospect, position.draftPosition)}
							class="ml-auto"
						>
							<Close size={24} />
						</button>
					</div>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
</div>