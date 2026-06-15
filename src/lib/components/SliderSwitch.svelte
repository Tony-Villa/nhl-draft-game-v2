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
			return '-rotate-1';
		}
		return 'rotate-1';
	});

	function switchLeft() {
		currentTab = left;
		switchVariable(left);
	}

	function switchRight() {
		currentTab = right;
		switchVariable(right);
	}
</script>

<div class="button-box relative flex justify-center border-[3px] border-black bg-white">
	<div
		class={`slider-indicator ${rotation} ${currentTab === left ? 'slider-indicator-left' : 'slider-indicator-right'}`}
	></div>
	<button
		onclick={switchLeft}
		disabled={currentTab === left}
		aria-pressed={currentTab === left}
		class="toggle-btn"
		type="button">{capitalizeFirstLetter(left)}</button
	>
	<button
		onclick={switchRight}
		disabled={currentTab === right}
		aria-pressed={currentTab === right}
		class="toggle-btn"
		type="button">{capitalizeFirstLetter(right)}</button
	>
</div>

<style lang="postcss">
	.toggle-btn {
		flex: 1;
		padding: 12px clamp(12px, 7vw, 40px);
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

	.button-box {
		width: min(100%, 26rem);
		min-height: 3.5rem;
	}

	.slider-indicator {
		top: -5px;
		position: absolute;
		width: 50%;
		height: calc(100% + 4px);
		background: #ff4f01;
		border: 3px solid black;
		box-shadow: 5px 5px 0px 0px #000000;
		transition:
			left 0.15s ease,
			transform 0.15s ease;
	}

	.slider-indicator-left {
		left: -2px;
	}

	.slider-indicator-right {
		left: calc(50% + 1px);
	}
</style>
