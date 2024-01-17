<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let showModal = $state(false);

	const { prospect, draftProspect, board } = $props();

	function draft(prospect, draftPosition) {
		draftProspect(prospect, draftPosition);
		showModal = !showModal;
	}
</script>

<div class="prospect-card">
	<Modal bind:showModal>
		{@render DraftPosition(board)}
	</Modal>
	<div class="prospect-card__header">
		<p>{prospect.rank !== '-' ? 'Rank: ' + prospect.rank : 'NR'}</p>
		<div class="prospect-card__position">
			<p>{prospect.position}</p>
			<p>|</p>
			<p>{prospect.shoots}</p>
		</div>
	</div>
	<h3>{prospect.name}</h3>
	<div class="prospect-card__league">
		<p>{prospect.league}</p>
		<p>|</p>
		<p>{prospect.team}</p>
	</div>
	<div class="prospect-card__personal-stats">
		<div class="prospect-card__measurements">
			<img src={prospect.nation} />
			<p>|</p>
			<p>{prospect.birthDay}</p>
		</div>
		<div class="prospect-card__measurements">
			<p>{prospect.weight} lbs</p>
			<p>|</p>
			<p>{prospect.height}</p>
		</div>
	</div>
	<div class="prospect-card__options">
		<button on:click={() => (showModal = !showModal)}>Draft</button>
		<button>Favorite</button>
	</div>
</div>

{#snippet DraftPosition(board)}
	<div class="draft-position">
		{#each board as cell}
			<button on:click={() => draft(prospect, cell.draftPosition)} class="draft-position__cell">
				<h3>
					{cell.draftPosition}
				</h3>
				<img src={cell.teamLogo} />
			</button>
		{/each}
	</div>
{/snippet}

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
			max-width: 700px;
			margin: 0 auto;

			.draft-position__cell {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: 10px;
				border: 1px solid black;
				border-radius: 5px;
				padding: 10px;
				width: 100px;
				height: 100px;
			}
		}
	}
</style>
