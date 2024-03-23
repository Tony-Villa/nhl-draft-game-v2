<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	import { getDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';

	import type { Prospect, DraftBoard } from '$lib/types';
	import Button from './Button.svelte';
	import Card from './Card.svelte';

	let showModal = $state(false);

	const draftSystem = getDraftSystem();

	let {
		prospect
	}: {
		prospect: Prospect;
	} = $props();

	function draft(prospect: Prospect, draftPosition: number) {
		draftSystem.addProspectToBoard(prospect, draftPosition);
		showModal = !showModal;
	}
</script>

<Card variant='small'>
	<div class="prospect-card relative flex w-40 flex-col content-between gap-2 md:w-52 pb-4 px-4 ">
		<!-- TODO: play with this idea (probably dumb af tho) -->
		<img
			src={prospect?.nation}
			alt="nationality"
			class="flag absolute left-0 top-0 w-10 object-cover opacity-40"
		/>
		<Modal bind:showModal>
			<div class="flex flex-wrap gap-2">
				{#each draftSystem.draftBoard as cell}
					{@render teamPicker(cell)}
				{/each}
			</div>
		</Modal>
		<div class="flex justify-between">
			<p class="font-semibold">{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}</p>
			<div class="flex content-end justify-end gap-2">
				<p>{prospect?.position}</p>
				<p>|</p>
				<p>{prospect?.shoots}</p>
			</div>
		</div>
		<h3 class="text-center">{prospect?.name}</h3>
		<div class="flex content-center justify-center gap-2">
			<p>{prospect?.league}</p>
			<p>|</p>
			<p>{prospect?.team}</p>
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex content-center justify-center gap-2">
				<!-- <img src={prospect?.nation} alt="nationality" />
				<p>|</p> -->
				<p>{prospect?.birthDay}</p>
			</div>
			<div class="flex content-center justify-center gap-2">
				<p>{prospect?.weight} lbs</p>
				<p>|</p>
				<p>{prospect?.height}</p>
			</div>
		</div>
		<div class="flex flex-1 content-end justify-center gap-2">
			<Button on:click={() => (showModal = !showModal)}>Draft</Button>
			<Button variant="secondary">Favorite</Button>
		</div>
	</div>
</Card>

{#snippet teamPicker(cell)}
	<button
		class="flex flex-col content-center justify-center gap-2 border border-black rounded-md p-2 w-20 h-20 md:w-28 md:h-28"
		on:click={() => draft(prospect as Prospect, cell?.draftPosition)}
		disabled={!!cell?.prospect}
	>
		<h3 class="text-center">
			{cell?.draftPosition}
		</h3>
		<img class="w-16 md:w-20" src={cell?.teamLogo} alt="team logo" />
	</button>
{/snippet}

<style lang="postcss">
	.flag {
		mask-image: linear-gradient(to right, rgba(0, 0, 0, 1) 40%, transparent 100%);
	}
</style>
