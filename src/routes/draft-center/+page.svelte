<script lang="ts">
	import { draftSystem } from '$lib/stores/prospects/draftSystem.svelte.js';
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';

	const { data } = $props();

	const draftEngine = draftSystem(data.prospects, data.draftboard);
</script>

<h1>draft center</h1>
<div class="draft-center">
	<div class="draft-board">
		<DraftBoard {draftEngine} />
	</div>
	<div class="prospects">
		<ProspectContainer {draftEngine} />
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
