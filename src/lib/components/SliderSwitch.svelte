<script lang="ts">
	import { capitalizeFirstLetter } from '$lib/helpers/capitalize-first-letter';
	import { untrack } from 'svelte';

	let {
		left,
		right,
		switchVariable
	}: { left: string; right: string; switchVariable: (tab: string) => void } = $props();

	let currentTab = $state(untrack(() => left));
	let rotation = $derived.by(() => {
		if (currentTab === left) {
			return '-rotate-[1deg]';
		}
		return 'rotate-[1deg]';
	});

	function switchLeft() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = '-2px';
		}
		currentTab = left;
	}

	function switchRight() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = 'calc(50% + 1px)';
		}
		currentTab = right;
	}
</script>

<div class="button-box relative my-5 flex h-full justify-center border-[3px] border-black bg-white">
	<div id="btn" class={`${rotation}`}></div>
	<button
		onclick={() => {
			switchLeft();
			switchVariable(left);
		}}
		disabled={currentTab === left}
		class="toggle-btn"
		type="button">{capitalizeFirstLetter(left)}</button
	>
	<button
		onclick={() => {
			switchRight();
			switchVariable(right);
		}}
		disabled={currentTab === right}
		class="toggle-btn"
		type="button">{capitalizeFirstLetter(right)}</button
	>
</div>

<style lang="postcss">
	.toggle-btn {
		padding: 10px 40px;
		cursor: pointer;
		background: transparent;
		border: 2px solid transparent;
		border-bottom: 4px solid transparent;
		border-right: 4px solid transparent;
		/* border-radius: 30px; */
		outline: none;
		position: relative;
		text-align: center;
		font-weight: 600;
		font-size: large;
	}

	#btn {
		left: -5px;
		top: -5px;
		position: absolute;
		width: 50%;
		height: calc(100% + 4px);
		background: #ff4f01;
		border: 3px solid black;
		box-shadow: 5px 5px 0px 0px #000000;
		/* rotate: rotation; */
		transition: 0.15s;
	}
</style>
