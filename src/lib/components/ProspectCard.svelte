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
	<div class="prospect-card relative flex w-48 flex-col content-between gap-2 pb-4 px-4 min-h-[235px] h-full md:w-52 ">
		<!-- TODO: play with this idea (probably dumb af tho) -->
		<img
			src={prospect?.nation}
			alt="nationality"
			class="flag absolute left-0 top-0 w-10 object-cover opacity-40"
		/>
		<Modal bind:showModal>
			<div class="flex flex-wrap justify-center gap-2">
				{#each draftSystem.draftBoard as cell}
					{@render teamPicker(cell)}
				{/each}
			</div>
		</Modal>
		<div class="flex justify-between">
			<p class="font-semibold">{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}</p>
			<div class="flex content-end justify-end gap-2 text-xs opacity-55">
				<p>{prospect?.position}</p>
				<p>|</p>
				<p>{prospect?.shoots}</p>
			</div>
		</div>
		<h3 class="text-center font-bold text-lg whitespace-break-spaces	leading-6 max-w-[14ch]">{prospect?.name}</h3>
		<div class="flex flex-col text-center mt-2 content-center justify-center gap-[0]">
			<p class="text-sm font-semibold">{prospect?.league}</p>
			<p class="text-xs opacity-55">{prospect?.team}</p>
		</div>

		<div class="flex flex-1 content-end justify-between gap-2 text-xs opacity-55">
			<!-- <img src={prospect?.nation} alt="nationality" />
			<p>|</p> -->
			<p>{prospect?.birthDay}</p>
			<p>{prospect?.height}</p>
			<p>{prospect?.weight} lbs</p>
		</div>

		<div class="flex flex-1 items-end justify-center gap-2">
			<Button on:click={() => (showModal = !showModal)}>Draft</Button>
			<!-- <Button variant="secondary">Favorite</Button> -->
		</div>
	</div>
</Card>

{#snippet teamPicker(cell)}
	<button
		class={`flex flex-col content-center justify-center gap-2 border border-black rounded-md p-2 w-20 h-20 md:w-28 md:h-28 bg-orange-100 ${!!cell?.prospect && 'bg-neutral-400'}`}
		on:click={() => draft(prospect as Prospect, cell?.draftPosition)}
		disabled={!!cell?.prospect}
	>
		<h3 class="text-center self-center font-semibold">
			{cell?.draftPosition}
		</h3>
		<img class="w-16 md:w-20 self-center" src={cell?.teamLogo} alt="team logo" />
	</button>
{/snippet}

<style lang="postcss">
	.flag {
		mask-image: linear-gradient(to right, rgba(0, 0, 0, 1) 40%, transparent 100%);
	}
</style>
