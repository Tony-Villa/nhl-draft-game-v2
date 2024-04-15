<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/user/userState.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';
	import Close from '$lib/icons/Close.svelte';
	import type { Prospect, User } from '$lib/types';
	import { slide } from 'svelte/transition';
	import Button from './Button.svelte';
	import Card from './Card.svelte';
	import { Popover } from 'flowbite-svelte';

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();
	let isSameDraftboard = $state(false);

	$effect(() => {
		compareDraftBoardToLocalStorage();
	});

	function removeProspect(prospect: Prospect, position: number) {
		draftSystem.removeProspectFromBoard(prospect, position);
	}

	function compareDraftBoardToLocalStorage() {
		const lastDraftBoard = localStorage.getItem('draftBoard');
		const currentDraftBoard = JSON.stringify(draftboardToMap(draftSystem.draftBoard));
		if (!lastDraftBoard) return;

		isSameDraftboard = lastDraftBoard === currentDraftBoard;
	}

	async function submitDraftBoard() {
		const payload = {
			draftboard: draftSystem.draftBoard,
			user: currentUser.user
		};

		localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));

		const draft = await fetch('/api/draft', {
			method: 'POST',
			body: JSON.stringify({ data: payload }),
			headers: {
				'content-type': 'application/json'
			}
		});

		compareDraftBoardToLocalStorage()

		const response = await draft.json();
	}
</script>

<div class="draft-board flex w-full flex-[2] flex-col gap-2 md:min-w-[450px]">
	<div class="flex items-end justify-end gap-3 pr-3">
		{#if currentUser.user}
			<p class="font-bold md:text-lg">Welcome {`, ${(currentUser.user as User)?.name}` || ''}</p>
		{:else}
			<p class="font-bold md:text-lg">Please sign in to submit your draft</p>
		{/if}
		<Button on:click={submitDraftBoard} 
		 id='submit-draft'
		 class="py-2" 
		 disabled={!currentUser.user || isSameDraftboard}>
			Submit Draft
		</Button>
		<Popover
			class="px-3 text-semibold font-light bg-orange-200 rounded-lg shadow-brut-shadow-sm outline-none border-black border-2" 
			triggeredBy="#submit-draft">
		  Your draft hasn't changed
	  </Popover>
	</div>

	<div class="mb-16 flex flex-wrap justify-center gap-2">
		{#each draftSystem?.draftBoard || [] as position}
			<Card variant="small" class="basis-[48%]">
				<div class="flex items-center px-2 py-2">
					<h2>{position.draftPosition}</h2>
					<img class="h-[50px] w-[50px]" src={position.teamLogo} alt="" />
					{#if position.prospect}
						<p class="ml-2 font-bold">{position?.prospect?.name}</p>
						<button
							on:click={() => removeProspect(position.prospect as Prospect, position.draftPosition)}
							class="ml-auto"
						>
							<Close size={24} />
						</button>
					{/if}
				</div>
			</Card>
		{/each}
	</div>
</div>
