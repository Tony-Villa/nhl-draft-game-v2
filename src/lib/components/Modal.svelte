<script lang="ts">
	let { showModal, children } = $props<{
		showModal: boolean;
		children: any;
	}>(); // boolean

	let dialog: HTMLDialogElement | null = $state(null); // HTMLDialogElement

	// $: if (dialog && showModal) dialog.showModal();
	$effect(() => {
		if (dialog && showModal) dialog.showModal();
		if (!showModal) dialog?.close();
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog?.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="relative" on:click|stopPropagation>
		<div class="absolute right-0 top-0 border-black border-[1px] px-2 py-0 rounded-md shadow-brut-shadow-sm">
			<button  on:click={() => dialog?.close()}>X</button>
		</div>

		<div class="mt-5">
			{@render children()}
		</div>
		<!-- svelte-ignore a11y-autofocus -->
		<!-- <button on:click={() => dialog?.close()}>close modal</button> -->
	</div>
</dialog>

<style lang="postcss">
	dialog {
		margin: auto;
		width: 80%;
		height: 70%;
		border-radius: 20px;
		border: none;
		padding: 20px;
		max-width: 1100px;
		box-shadow: 8px 8px 0px 0px #000000;
		background-color: #fff7ed;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.7);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}
</style>
