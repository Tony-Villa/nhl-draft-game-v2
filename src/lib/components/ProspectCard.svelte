<script lang="ts">
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser } from '$lib/global-state/user-state.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';
	import { cmToFeetInches, isHeightInCm } from '$lib/helpers/height-conversion';

	import type { DraftBoard, Prospect } from '$lib/types';
	import Card from './Card.svelte';
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import { buttonOptions } from './Button.options';

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();
	const draftState = getDraftState();

	let {
		prospect
	}: {
		prospect: Prospect & { isDrafted?: boolean; isTemporary?: boolean; isPermanent?: boolean };
	} = $props();

	// Check if prospect is drafted (use passed-in status since it's calculated reactively in ProspectContainer)
	const isDrafted = $derived.by(() => {
		// Access the reactive sets to trigger reactivity
		draftSystem.temporaryDraftedIds.size;
		draftSystem.permanentDraftedIds.size;
		
		// Always check the draft system directly for most up-to-date status
		const drafted = prospect.id ? draftSystem.isDrafted(prospect.id) : false;
		
		return drafted;
	});
	const isTemporary = $derived.by(() => {
		// Access the reactive sets to trigger reactivity
		draftSystem.temporaryDraftedIds.size;
		
		// Always check the draft system directly for most up-to-date status
		return prospect.id ? draftSystem.isTemporarilyDrafted(prospect.id) : false;
	});

	// Format height for display
	const formattedHeight = isHeightInCm(prospect.height) ? cmToFeetInches(prospect.height) : prospect.height;


	let dialogOpen = $state(false);

	function draft(prospect: Prospect, draftPosition: number) {
		draftSystem.addProspectToBoard(prospect, draftPosition);

		draftState.updateDraftStatus(false);

		if(!currentUser.user){
			localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
		}

		// Close the dialog after drafting
		dialogOpen = false;
	}

	function undraft(prospect: Prospect) {
		// Find which position this prospect is drafted to
		const draftedPosition = draftSystem.draftBoard.find(cell => cell.prospect?.id === prospect.id);
		if (draftedPosition) {
			draftSystem.removeProspectFromBoard(prospect, draftedPosition.draftPosition);
			
			draftState.updateDraftStatus(false);

			if(!currentUser.user){
				localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
			}
		}
	}
</script>

<Dialog.Root bind:open={dialogOpen}>	<Card size='md' class={isDrafted ? 'border-dashed border-gray-500 bg-gray-50 opacity-50' : ''}>
		<div class="prospect-card relative flex flex-col h-full content-between gap-2 pb4 px-4">
			<!-- Header -->
			<div class="prospect-header flex justify-between mb-[15px] border-black border-b-[3px] pb-[10px]">
				<p class="text-lg font-extrabold uppercase">
					{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}
				</p>

				<div class="flex gap-2">
					{#if isDrafted}
						<div class="flex items-center  px-[8px] py-[3px] font-extrabold text-sm border-dashed border-[2px] border-gray-500 text-gray-600 bg-red-400 ">
							<p>DRAFTED</p>
						</div>
					{/if}
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
			</div>

			<!-- Content -->
			<div class="flex-1 flex flex-col">
				<div class="prospect-name text-2xl font-extrabold mb-[5px] uppercase">
					<p>
						{prospect?.name}
					</p>	
				</div>

				<div class="prospect-team font-bold mb-[15px] bg-black text-white px-2 py-[3px] -skew-x-3">
					<p>{prospect?.team} - {prospect?.league}</p>
				</div>
				
				<div class="prospect-details flex flex-wrap gap-[15px] mt-[15px] border-t-2 border-black border-dashed pt-[15px]">
					{@render prospectStat(formattedHeight, 'Height')}
					{@render prospectStat(prospect?.weight, 'Weight')}
					{@render prospectStat(prospect?.birthDay, 'DOB')}
				</div>
			</div>
			
			<!-- Button at bottom -->
			<div class="flex justify-center mt-4">
				{#if isDrafted}
					<!-- Show "Undraft" button for drafted players -->
					<button
						class={buttonOptions({
							class: 'w-[60%]',
							variant: 'outline'
						})}
						onclick={() => undraft(prospect)}
					>
						Undraft
					</button>
				{:else}
					<!-- Show normal "Draft" button -->
					<Dialog.Trigger 
						class={buttonOptions({
							class: 'w-[60%]',
							variant: 'primary'
						})}
					>
						Draft
					</Dialog.Trigger>
				{/if}
			</div>
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