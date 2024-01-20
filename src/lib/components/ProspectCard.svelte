<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import type { DraftSystem } from '$lib/stores/prospects/draftSystem.svelte';

	import type { Prospect, DraftBoard } from '$lib/types';

	let showModal = $state(false);

	let {
		prospect,
		draftProspect,
		board
	}: {
		prospect: Prospect | unknown;
		draftProspect: DraftSystem['addProspectToBoard'] | unknown;
		board: DraftBoard[] | unknown;
	} = $props();

	let typedBoard = board as DraftBoard[] | [];

	function draft(prospect: Prospect, draftPosition: number) {
		(draftProspect as DraftSystem['addProspectToBoard'])(prospect, draftPosition);
		showModal = !showModal;
	}
</script>

<div class="prospect-card">
	<Modal bind:showModal>
		<div class="draft-position">
			{#each typedBoard as cell}
				<button
					class="draft-position__cell"
					on:click={() => draft(prospect as Prospect, (cell as DraftBoard)?.draftPosition)}
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
		<p>{(prospect as Prospect)?.rank !== '-' ? 'Rank: ' + (prospect as Prospect)?.rank : 'NR'}</p>
		<div class="prospect-card__position">
			<p>{(prospect as Prospect)?.position}</p>
			<p>|</p>
			<p>{(prospect as Prospect)?.shoots}</p>
		</div>
	</div>
	<h3>{(prospect as Prospect)?.name}</h3>
	<div class="prospect-card__league">
		<p>{(prospect as Prospect)?.league}</p>
		<p>|</p>
		<p>{(prospect as Prospect)?.team}</p>
	</div>
	<div class="prospect-card__personal-stats">
		<div class="prospect-card__measurements">
			<img src={(prospect as Prospect)?.nation} alt="nationality" />
			<p>|</p>
			<p>{(prospect as Prospect)?.birthDay}</p>
		</div>
		<div class="prospect-card__measurements">
			<p>{(prospect as Prospect)?.weight} lbs</p>
			<p>|</p>
			<p>{(prospect as Prospect)?.height}</p>
		</div>
	</div>
	<div class="prospect-card__options">
		<button on:click={() => (showModal = !showModal)}>Draft</button>
		<button>Favorite</button>
	</div>
</div>

<style lang="postcss">
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
