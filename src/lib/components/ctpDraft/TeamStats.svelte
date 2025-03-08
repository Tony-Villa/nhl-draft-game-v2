<script lang="ts">
	import { capitalizeFirstLetter } from '$lib/helpers/capitalize-first-letter';

	export let teams: any;
	export let player: string;

	let columns = ['', 'GP', 'Rem', 'W', 'L', 'OT', 'Pts'];
</script>

<div class="card teamStats">
	<p>{capitalizeFirstLetter(player)}</p>
	<table rules="rows">
		<tbody>	
			<tr>
				{#each columns as column}
					<th>{column}</th>
				{/each}
			</tr>
			{#each teams as team}
				<tr>
					<td>
						<img class="teamStats__logo" src={team.logo} alt={`${team.teamName} logo`} />
					</td>
					<td>{team.gamesPlayed}</td>
					<td>{team.gamesRemaining}</td>
					<td>{team.record.wins}</td>
					<td>{team.record.losses}</td>
					<td>{team.record.ot}</td>
					<td>{team.points}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="postcss">

	p {
    color: black;
    font-weight: 700;
    font-size: 20px;

    @media (max-width: 600px) {
      font-size: 14px;
    }
  }

	.teamStats {
		flex: 1;
		display: flex;
		flex-direction: column;
		flex-wrap: wrap;
		padding: 0 40px 20px;

		p {
			text-align: center;

			@media (max-width: 1000px) {
				font-size: 18px;
			}
		}

		table {
			color: black;

			td {
				text-align: center;
				padding: 4px 0;
			}
		}

		.teamStats__logo {
			width: 50px;
		}
	}
</style>
