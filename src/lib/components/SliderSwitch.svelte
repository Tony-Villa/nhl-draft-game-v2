<script lang="ts">
	import { capitalizeFirstLetter } from "$lib/helpers/capitalize-first-letter";

	let {  left, right, switchVariable }: { left: string; right: string;switchVariable: (tab: string) => void } = $props();

	let currentTab = $state(left)

	function switchLeft() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = '-2px';
		}
		currentTab = left
	}

	function switchRight() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = 'calc(50% + 2px)';
		}
		currentTab = right
	}
</script>

<div class="button-box h-full my-5 relative border-2 border-black rounded-[30px] bg-orange-200 flex justify-center">
	<div id="btn"></div>
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
		border-radius: 30px;
		outline: none;
		position: relative;
		text-align: center;
	}

	#btn {
		left: -3px;
		top: -2px;
		position: absolute;
		width: 50%;
		height: calc(100% + 4px);
		background: #e67e22;
		border: 2px solid black;
		box-shadow: 2px 2px 0px 0px #000000;
		border-radius: 30px;
		transition: 0.75s;
	}
</style>
