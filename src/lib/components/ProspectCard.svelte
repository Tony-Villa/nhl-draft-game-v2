<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/userState.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';
	import { fade } from 'svelte/transition';

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

	
			<!-- < class="flex justify-between">
				<p class="font-semibold">{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}</p>
				<div class="flex content-end justify-end gap-2 text-xs opacity-55">
					<p>{prospect?.position}</p>
					<p>|</p>
					<p>{prospect?.shoots}</p>
				</div>
			</>
	
			<div class="flex  flex-1 flex-col justify-between">
					<h3 class="text-center font-bold text-lg mt-3 whitespace-break-spaces leading-6 max-w-[14ch]">{prospect?.name}</h3>
		
					<div class="flex flex-col text-center mt-2 content-center justify-center gap-[0]">
						<p class="text-sm font-semibold">{prospect?.league}</p>
						<p class="text-xs opacity-55">{prospect?.team}</p>
					</div>
			
					<div class="flex flex-col gap-3 justify-end">
		
					<div class="flex content-end justify-between gap-2 text-xs opacity-55">
						<p>{prospect?.birthDay}</p>
						<p>{prospect?.height}</p>
						<p>{prospect?.weight} lbs</p>
					</div>
			
					<div class="flex items-end justify-center gap-2">
						<Dialog.Trigger>
							<div class={`border-2 shadow-brut-shadow-sm rounded-md border-solid border-black px-3 py-1 relative 
						bg-yellow-400 font-semibold`}>Draft</div>
						</Dialog.Trigger>
					</div>
				</div>
			</div> -->


		</div>
	</Card>
	<Dialog.Content class="max-w-[90%] md:max-w-[50%]">
		<Dialog.Header class='md:mx-auto'>
      <Dialog.Title>
				<h2>
					Who will be drafting {prospect.name}?
				</h2>
			</Dialog.Title>
    </Dialog.Header>

		<div class="flex flex-wrap justify-center gap-2 pb-10 max-h-[75dvh] overflow-y-scroll ">
			{#each draftSystem.draftBoard as cell}
				{@render teamPicker(cell)}
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>


{#snippet teamPicker(cell: DraftBoard)}
	<button
		class={`flex flex-col content-center justify-center gap-2 border border-black rounded-md p-2 w-20 h-20 md:w-28 md:h-28
		 ${!!cell?.prospect ? '' : 'hover:bg-[#f2dabd]'} ${!!cell?.prospect ? 'bg-neutral-400' : 'bg-orange-100'}`}
		onclick={() => draft(prospect as Prospect, cell?.draftPosition)}
		disabled={!!cell?.prospect}
	>
		<h3 class="text-center self-center font-semibold">
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