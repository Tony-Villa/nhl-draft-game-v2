<script lang="ts">
	import type { PositionFilter } from '$lib/types';

	// import { sortFilter } from '~stores/prospectStore';

	let {
		sortFilter,
		sortPosition
	}: {
		sortFilter: PositionFilter;
		sortPosition: (options: PositionFilter, option: string) => void;
	} = $props();

	// const handleClick = (option: string) => {
	// 	newOptions = { [option]: !$options[option] };
	// };
</script>

{#each Object.keys(sortFilter) as option (option)}
	<button
		class="tertiary multiple-select {sortFilter[option] ? 'selected' : ''}"
		on:click={() => sortPosition(sortFilter, option)}>{option}</button
	>
{/each}

<style lang="postcss">
	.multiple-select {
		min-width: 60px;
	}

	.selected {
		background: rgba(185, 249, 80, 0.8);
		color: var(--gray-9);
	}
</style>
