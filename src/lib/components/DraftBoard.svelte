<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/user/userState.svelte';
	import Close from '$lib/icons/Close.svelte';
	import type { Prospect } from '$lib/types';
	import Button from './Button.svelte';
	import Card from './Card.svelte';

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();

	function removeProspect(prospect: Prospect, position: number) {
		draftSystem.removeProspectFromBoard(prospect, position);
	}

	async function submitDraftBoard() {
		const payload = {
			draftboard: draftSystem.draftBoard,
			user: currentUser.user
		};

		const draft = await fetch('/api/draft', {
			method: 'POST',
			body: JSON.stringify({ data: payload }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const response = await draft.json();
	}
</script>

<div class="draft-board flex w-full flex-[2] flex-col gap-2 md:min-w-[450px] ">
	<!-- <h2>Draft Board</h2> -->
	<div class="w-auto self-end pr-2">
		<Button on:click={submitDraftBoard} class="py-2">Submit Draft</Button>
	</div>
	<div class="flex flex-wrap justify-center gap-2 mb-16">
		{#each draftSystem?.draftBoard || [] as position}
		<Card variant='small' class='basis-[48%]' >
			<div class="flex items-center px-2 py-2">
				<h2>{position.draftPosition}</h2>
				<img class="h-[50px] w-[50px]" src={position.teamLogo} alt="" />
				{#if position.prospect}
					<p class="font-bold ml-2">{position?.prospect?.name}</p>
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
