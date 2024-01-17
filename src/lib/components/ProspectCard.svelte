<script lang="ts">
	const { prospect } = $props();
</script>

<div class="prospect-card">
	<div class="prospect-card__header">
		<p>{prospect.rank !== '-' ? 'Rank: ' + prospect.rank : 'NR'}</p>
		<div class="prospect-card__position">
			<p>{prospect.position}</p>
			<p>|</p>
			<p>{prospect.shoots}</p>
		</div>
	</div>
	<h3>{prospect.name}</h3>
</div>

<!-- rank, -->
<!-- name, -->
<!-- position, -->
<!-- nation, -->
<!-- team, -->
<!-- league, -->
<!-- birthDay, -->
<!-- height, -->
<!-- weight, -->
<!-- shoots -->

<style lang="postcss">
	.prospect-card {
		border: 1px solid black;
		border-radius: 5px;
		padding: 10px;
		width: 200px;
	}

	h3 {
		text-align: center;
	}

	.prospect-card__header {
		display: flex;
		justify-content: space-between;
	}

	.prospect-card__position {
		display: flex;
		align-items: flex-end;
		gap: 10px;
	}
</style>
