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

<div class="flex gap-[10px]">

	{#each Object.keys(sortFilter) as option (option)}
		<Button
			variant={sortFilter[option] ? 'info' : 'outline'}
			shadow={sortFilter[option] ? 'none' : 'md'}
			class={`px-[15px] py-[10px] font-extrabold cursor-pointer
			${sortFilter[option] ? 'translate-x-[5px] translate-y-[5px]' : ''}`}
			onclick={() => sortPosition(sortFilter, option)}>{option}</Button
		>
	{/each}
</div>


<!-- .position-btn {
	padding: 10px 15px;
	border: 3px solid var(--black);
	background-color: var(--white);
	color: var(--black);
	font-weight: 800;
	cursor: pointer;
	font-size: 16px;
	transition: all 0.1s ease;
} -->