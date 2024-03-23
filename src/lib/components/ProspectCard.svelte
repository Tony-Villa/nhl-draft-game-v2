<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';

	import type { Prospect, DraftBoard } from '$lib/types';
	import Button from './Button.svelte';

	let showModal = $state(false);

	const draftSystem = getDraftSystem();

	let {
		prospect
	}: {
		prospect: Prospect;
	} = $props();

	function draft(prospect: Prospect, draftPosition: number) {
		draftSystem.addProspectToBoard(prospect, draftPosition);
		showModal = !showModal;
	}
</script>

<div class="prospect-card relative">
	<!-- TODO: play with this idea (probably dumb af tho) -->
	<img
		src={prospect?.nation}
		alt="nationality"
		class="flag absolute left-0 top-0 w-10 object-cover opacity-40"
	/>
	<Modal bind:showModal>
		<div class="draft-position">
			{#each draftSystem.draftBoard as cell}
				<button
					class="draft-position__cell"
					on:click={() => draft(prospect as Prospect, (cell as DraftBoard)?.draftPosition)}
					disabled={!!(cell as DraftBoard)?.prospect}
				>
					<h3>
						{(cell as DraftBoard)?.draftPosition}
					</h3>
					<img class="logo" src={(cell as DraftBoard)?.teamLogo} alt="team logo" />
				</button>
			{/each}
		</div>
	</Modal>
	<div class="prospect-card__header">
		<p class="font-semibold">{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}</p>
		<div class="prospect-card__position">
			<p>{prospect?.position}</p>
			<p>|</p>
			<p>{prospect?.shoots}</p>
		</div>
	</div>
	<h3>{prospect?.name}</h3>
	<div class="prospect-card__league">
		<p>{prospect?.league}</p>
		<p>|</p>
		<p>{prospect?.team}</p>
	</div>
	<div class="prospect-card__personal-stats">
		<div class="prospect-card__measurements">
			<!-- <img src={prospect?.nation} alt="nationality" />
			<p>|</p> -->
			<p>{prospect?.birthDay}</p>
		</div>
		<div class="prospect-card__measurements">
			<p>{prospect?.weight} lbs</p>
			<p>|</p>
			<p>{prospect?.height}</p>
		</div>
	</div>
	<div class="prospect-card__options">
		<Button on:click={() => (showModal = !showModal)}>Draft</Button>
		<Button variant="secondary">Favorite</Button>
	</div>
</div>

<style lang="postcss">
	.flag {
		mask-image: linear-gradient(to right, rgba(0, 0, 0, 1) 40%, transparent 100%);
	}

	.prospect-card {
		border: 1px solid black;
		border-radius: 5px;
		padding: 10px;
		width: 200px;
		display: flex;
		flex-direction: column;
		align-items: space-between;
		gap: 10px;

		h3 {
			text-align: center;
		}

		.prospect-card__header {
			display: flex;
			justify-content: space-between;
		}

		.prospect-card__position {
			display: flex;
			justify-content: flex-end;
			align-items: flex-end;
			gap: 10px;
		}

		.prospect-card__league {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		.prospect-card__personal-stats {
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.prospect-card__measurements {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 10px;
		}

		.prospect-card__options {
			display: flex;
			justify-content: center;
			align-items: flex-end;
			gap: 10px;
			flex: 1;
		}

		.draft-position {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
		}
		.draft-position__cell {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 10px;
			border: 1px solid black;
			border-radius: 5px;
			padding: 10px;
			width: 100px;
			height: 100px;

			.logo {
				width: 70px;
				height: auto;
			}
		}
	}
</style>
