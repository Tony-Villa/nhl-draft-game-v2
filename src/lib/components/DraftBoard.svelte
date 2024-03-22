<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/user/userState.svelte';
	import type { Prospect } from '$lib/types';

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

<div class="draft-board flex w-full flex-[1] flex-col">
	<h2>Draft Board</h2>
	<button on:click={submitDraftBoard}> submit draft </button>
	<div class="flex flex-wrap gap-2">
		{#each draftSystem?.draftBoard || [] as position}
			<div class="container basis-[48%]">
				<h2>{position.draftPosition}</h2>
				<img class="h-[50px] w-[50px]" src={position.teamLogo} alt="" />
				{#if position.prospect}
					<p>{position?.prospect?.name}</p>
					<button
						on:click={() => removeProspect(position.prospect as Prospect, position.draftPosition)}
						class="ml-auto"
					>
						X
					</button>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">
	.container {
		border: 1px solid black;
		border-radius: 10px;
		width: 100%;
		padding: 10px;
		margin: 10px 0;
		display: flex;
		/* flex: 1; */
		align-items: center;
	}
</style>
