<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/userState.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';

	import type { DraftBoard, Prospect } from '$lib/types';
	import Card from './Card.svelte';
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { getDraftState } from '$lib/globalState/draftState.svelte';
	import { buttonOptions } from './Button.options';

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();
	const draftState = getDraftState();

	let {
		prospect
	}: {
		prospect: Prospect;
	} = $props();

	function draft(prospect: Prospect, draftPosition: number) {
		draftSystem.addProspectToBoard(prospect, draftPosition);

		draftState.updateDraftStatus(false);

		if(!currentUser.user){
			localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
		}
	}
</script>

<Dialog.Root>
	<Card size='md'>
		<div class={`prospect-card relative flex flex-col content-between gap-2 pb-4 px-4`}>

			<div class="prospect-header flex justify-between mb-[15px] border-black border-b-[3px] pb-[10px]">
				<p class="text-lg font-extrabold uppercase">
					{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}
				</p>

				<div class="inline-block px-[10px] py-[5px] font-extrabold text-lg border-black border-[3px]">
					<p>
						{#if prospect?.position === "D" || prospect?.position === "F"}
							{prospect?.shoots}{prospect?.position}
						{:else}
							{prospect?.position}
						{/if}
					</p>
				</div>
			</div>

			<div class="prospect-name text-2xl font-extrabold mb-[5px] uppercase">
				<p>
					{prospect?.name}
				</p>	
			</div>

			<div class="prospect-team font-bold mb-[15px] bg-black text-white px-2 py-[3px] -skew-x-3">
				<p>{prospect?.team} - {prospect?.league}</p>
			</div>

			<div class="prospect-details flex flex-wrap gap-[15px] mt-[15px] border-t-2 border-black border-dashed pt-[15px]">
				{@render prospectStat(prospect?.height, 'Height')}
				{@render prospectStat(prospect?.weight, 'Weight')}
				{@render prospectStat(prospect?.birthDay, 'DOB')}
			</div>
			
			<Dialog.Trigger class={buttonOptions({class: 'w-[60%] mt-[15px]'})}>
				draft
			</Dialog.Trigger>


		</div>
	</Card>
	
	<Dialog.Content class="max-w-[90%] md:max-w-[70%] rounded-none md:rounded-none shadow-button-shadow md:shadow-button-shadow">
		<Dialog.Header class='md:mx-auto'>
      <Dialog.Title>
				<h2 class="text-center self-center text-black font-extrabold text-[20px] md:text-[28px] h-6 md:h-8 mb-2 pb-0">
					Who will be drafting {prospect.name}?
				</h2>
			</Dialog.Title>
    </Dialog.Header>

		<div class="flex flex-wrap justify-center gap-1 md:gap-2 pb-10 max-h-[75dvh] overflow-y-scroll ">
			{#each draftSystem.draftBoard as cell}
				{@render teamPicker(cell)}
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>


{#snippet teamPicker(cell: DraftBoard)}
	<button
		class={`flex flex-col content-center justify-center gap-1 md:gap-2 border-[3px] border-black p-2 w-20 h-20 md:w-28 md:h-28
		 ${!!cell?.prospect ? '' : 'hover:bg-primary'} ${!!cell?.prospect ? 'bg-neutral-400' : 'bg-white'}`}
		onclick={() => draft(prospect as Prospect, cell?.draftPosition)}
		disabled={!!cell?.prospect}
	>
		<h3 class="text-center self-center text-black font-extrabold text-[20px] md:text-[28px] h-6 md:h-8 mb-0 pb-0 ">
			{cell?.draftPosition}
		</h3>
		<img class="w-16 md:w-20 self-center" src={cell?.teamLogo} alt="team logo" />
	</button>
{/snippet}


<!-- PROSPECT DETAILS -->

{#snippet prospectStat(stat: string, label: string)}
	<div class="prospect-stat flex flex-col flex-1 min-w-17">
		{@render statValue(stat, label)}
		{@render statLabel(label)}
	</div>
{/snippet}

{#snippet statValue(stat: string, label?: string)}
	<span class="stat-value font-extrabold">
		{#if label && label ==='Weight'}
			{stat} lbs
		{:else}
			{stat}
		{/if}
	</span>
{/snippet}

{#snippet statLabel(label: string)}
	<span class="stat-label text-xs uppercase tracking-[1px]">
		{label}
	</span>
{/snippet}