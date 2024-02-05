<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import type { DraftBoard, Prospect } from '$lib/types';
	import { json } from '@sveltejs/kit';

	const draftSystem = getDraftSystem();

	function undraftProspect(prospect: Prospect, position: number) {
		draftSystem.removeProspectFromBoard(prospect);
	}

	async function submitDraftBoard() {
		const draft = await fetch('/api/draft', {
			method: 'POST',
			body: JSON.stringify({ data: draftSystem.draftBoard }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const response = await draft.json();
	}
</script>

<div class="draft-board">
	<h2>Draft Board</h2>
	<button on:click={submitDraftBoard}> submit draft </button>
	{#each draftSystem?.draftBoard || [] as position}
		<div class="position__container">
			<h2>{position.draftPosition}</h2>
			<img class="position__logo" src={position.teamLogo} alt="" />
			{#if position.prospect}
				<p>{position.prospect.name}</p>
				<button
					on:click={() => undraftProspect(position.prospect as Prospect, position.draftPosition)}
					class="position__remove"
				>
					X
				</button>
			{/if}
		</div>
	{/each}
</div>

<style lang="postcss">
	.position__container {
		border: 1px solid black;
		border-radius: 10px;
		padding: 10px;
		margin: 10px 0;
		display: flex;
		flex: 1;
		align-items: center;
		.position__logo {
			width: 50px;
			height: 50px;
		}

		.position__remove {
			margin-left: auto;
		}
	}
</style>
