<script lang="ts">
	import Details from '$lib/components/ctpDraft/Details.svelte';
	import Summary from '$lib/components/ctpDraft/Summary.svelte';
  import './ctp.pcss'

	export let data;

	let theme = 'dark';
</script>

<svelte:head>
	<title>CTP Draft</title>
</svelte:head>

<div class="main-content {theme}">
	<div class="main-summary">
		<Summary drafts={data} />
	</div>
	<div class="main-details">
		<Details draftType="Points" draft={data.pointsDraftData} />
	</div>
</div>

<style lang="postcss">

	.main-content {
		display: flex;
		flex-wrap: wrap;
		flex-direction: column;
		margin: 0 auto;
		max-width: 1154px;

		@media (max-width: 1000px) {
			max-width: 360px;
		}
	}

	.main-summary {
		display: flex;
		justify-content: center;

		@media (max-width: 1000px) {
			max-width: 360px;
		}
	}

	.main-details {
		@media (max-width: 1000px) {
			max-width: 360px;
		}
	}

	.light {
		--background-color: #e05a36;
		--accent-color: #47243b;
	}
	.dark {
		--background-color: #47243b;
		--accent-color: #c0c0c0;
	}
</style>