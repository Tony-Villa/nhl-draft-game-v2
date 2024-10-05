<script lang="ts">
	import { capitalizeFirstLetter } from "$lib/helpers/capitalize-first-letter";


	export let draftData: any;
	export let title: string;

</script>

<div class=" summary__row">
	<h2 class="summary_title">{title.toUpperCase()} DRAFT</h2>
	<div class="summary_player_stats">
		{#each draftData as player}
			<div class=" card summary_name_stats {player.gameState === 'winning' ? 'winning' : ''}">
				<p>{capitalizeFirstLetter(player.playerName)}:</p>
				<div class="total-points">
					<p class="emphasis">{player.total}</p>
					<p>pts</p>
				</div>
			</div>
		{/each}
	</div>
</div>

<style lang="postcss">

	h2 {
    font-size: 62px;
    text-shadow: 4px 4px 0 black;
    font-weight: 800;
    margin: 0;
    -webkit-text-stroke-width: 2px;
    -webkit-text-stroke-color: black;

    @media (max-width: 1000px) {
      font-size: 36px;
      text-shadow: 2px 2px 0 black;
      -webkit-text-stroke-width: 1px;
    }

    @media (max-width: 600px) {
      font-size: 24px;
      text-shadow: 2px 2px 0 black;
      -webkit-text-stroke-width: 1px;
    }
  }

  p {
    color: black;
    font-weight: 700;
    font-size: 20px;

    @media (max-width: 600px) {
      font-size: 14px;
    }
  }

	.summary__row {
		display: flex;
		padding: 0 40px;
		gap: 30px;

		@media (max-width: 1000px) {
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: 10px;
		}
	}

	.summary_player_stats {
		display: flex;
		padding: 0 40px;
		gap: 30px;
		align-items: center;
		justify-content: center;
	}

	.summary_name_stats {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 50px;
		gap: 10px;
		height: 80%;
		max-height: 70px;
		max-width: 185px;

		@media (max-width: 600px) {
			width: 40px;
			height: 100px;
		}

		.total-points {
			display: flex;
			align-items: center;
			gap: 2px;

			p {
				font-weight: 700;
			}

			.emphasis {
				font-weight: 900;
			}
		}
	}

	.winning {
		background-color: #006a60;

		p {
			color: white;
			text-shadow: 2px 2px 0 black;
		}
	}
</style>
