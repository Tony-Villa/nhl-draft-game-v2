<script lang="ts">
	import TeamStats from './TeamStats.svelte';

	export let draft: any;
	export let draftType: any;
</script>

<div class="details">
	<div class="detail__stats">
		{#each draft as d}
			<TeamStats player={d.playerName} teams={d.teamStats} />
		{/each}
	</div>
</div>

<style lang="postcss">
	.details {
		display: flex;
		flex-direction: column;
		padding: 20px 0;
		gap: 10px;
		margin-top: 30px;

		.detail__stats {
			display: flex;
			flex-wrap: wrap;
			gap: 20px;
		}
	}
</style>
