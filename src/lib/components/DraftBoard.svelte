<script lang="ts">
	const { draftEngine } = $props();
</script>

<div class="draft-board">
	<h2>Draft Board</h2>
	{#each draftEngine.draftBoard || [] as position}
		<div class="position__container">
			<h2>{position.draftPosition}</h2>
			<img class="position__logo" src={position.teamLogo} alt="" />
			{#if position.prospect}
				<p>{position.prospect.name}</p>
				<button
					on:click={() =>
						draftEngine.removeProspectFromBoard(position.prospect, position.draftPosition)}
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
