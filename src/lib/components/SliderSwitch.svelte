<script lang="ts">
	let { switchVariable }: { selectedTab: string; switchVariable: (tab: string) => void } = $props();

	function switchLeft() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = '0';
		}
	}

	function switchRight() {
		const btn = document.getElementById('btn');
		if (btn?.style) {
			btn.style.left = '50%';
		}
	}
</script>

<div class="button-box flex justify-center">
	<div id="btn"></div>
	<button
		onclick={() => {
			switchLeft();
			switchVariable('prospects');
		}}
		class="toggle-btn"
		type="button">Prospects</button
	>
	<button
		onclick={() => {
			switchRight();
			switchVariable('draftboard');
		}}
		class="toggle-btn"
		type="button">DraftBoard</button
	>
</div>

<style lang="postcss">
	.button-box {
		/* width: 100%; */
		height: 100%;
		margin: 20px auto;
		/* margin: 35px auto; */
		/* margin: 10px auto; */
		position: relative;
		outline: 2px solid black;
		border-radius: 30px;
		background-color: #fed7aa;
	}

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
		/* margin-bottom: 10px; */
	}

	#btn {
		left: 0;
		top: 0;
		position: absolute;
		width: 50%;
		height: 100%;
		background: #e67e22;
		border: 2px solid black;
		border-bottom: 4px solid black;
		border-right: 4px solid black;
		border-radius: 30px;
		transition: 0.5s;
	}
</style>
