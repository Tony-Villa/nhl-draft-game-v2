<script lang="ts">
	import type { PositionFilter } from '$lib/types';
	import Button from './Button.svelte';

	// import { sortFilter } from '~stores/prospectStore';

	let {
		sortFilter = $bindable(),
		sortPosition
	}: {
		sortFilter: PositionFilter;
		sortPosition: (options: PositionFilter, option: string) => void;
	} = $props();

	// const handleClick = (option: string) => {
	// 	newOptions = { [option]: !$options[option] };
	// };
</script>

<div class="flex gap-2">

	{#each Object.keys(sortFilter) as option (option)}
		<Button
			variant="{sortFilter[option] ? 'primary' : 'secondary'}"
			onclick={() => sortPosition(sortFilter, option)}>{option}</Button
		>
	{/each}
</div>

<style lang="postcss">
	.multiple-select {
		min-width: 60px;
	}

	.selected {
		background: rgba(185, 249, 80, 0.8);
		color: var(--gray-9);
	}
</style>
