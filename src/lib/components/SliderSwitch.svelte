<script lang="ts">
	let { switchVariable }: { switchVariable: (tab: string) => void } = $props();

	function switchLeft() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = '-2px';
		}
	}

	function switchRight() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = 'calc(50% + 2px)';
		}
	}
</script>

<div class="button-box h-full my-5 relative border-2 border-black rounded-[30px] bg-orange-200 flex justify-center">
	<div id="btn"></div>
	<button
		on:click={() => {
			switchLeft();
			switchVariable('prospects');
		}}
		class="toggle-btn"
		type="button">Prospects</button
	>
	<button
		on:click={() => {
			switchRight();
			switchVariable('draftboard');
		}}
		class="toggle-btn"
		type="button">DraftBoard</button
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
