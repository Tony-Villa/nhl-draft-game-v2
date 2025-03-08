<script lang="ts">
	import SummaryRow from './SummaryRow.svelte';

	export let drafts: any;
</script>

<div class="summary">
	<SummaryRow draftData={drafts.pointsDraftData} title="Points" />
</div>

<style lang="postcss">
	.summary {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
</style>
