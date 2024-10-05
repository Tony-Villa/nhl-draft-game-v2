<script lang="ts">
</script>

<div class="banner">
	<h1>CTP DRAFT</h1>
</div>

<style lang="postcss">

h1 {
	font-size: 96px;
	text-shadow: 6px 6px 0 black;
	font-weight: 900;
	margin: 0;
	-webkit-text-stroke-width: 3px;
	-webkit-text-stroke-color: black;

	@media (max-width: 600px) {
		font-size: 48px;
		text-shadow: 4px 4px 0 black;
		-webkit-text-stroke-width: 2px;
	}
}

	.banner {
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		display: flex;
		justify-content: center;
		padding: 5px;
		margin: 50px 0;
		margin-bottom: 70px;
		rotate: -3deg;
		background-color: var(--accent-color);
		margin-left: -15px;
		width: 110%;
		outline: 1px solid transparent;

		@media (max-width: 1000px) {
			margin: 20px 0;
			margin-bottom: 50px;
			margin-left: -15px;
		}
	}
</style>
