<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';

	const { data } = $props<{
		data: any;
	}>();

	// console.log(data);
</script>

<h1 class="text-center text-6xl font-bold uppercase">draft center</h1>
<div class="draft-center">
	<div class="draft-board">
		<DraftBoard />
	</div>
	<div class="prospects">
		<ProspectContainer />
	</div>
</div>

<style lang="postcss">
	.draft-center {
		display: flex;
		gap: 20px;
		padding: 20px;
	}
	.draft-board {
		flex: 1;
	}
	.prospects {
		flex: 3;
	}
</style>
