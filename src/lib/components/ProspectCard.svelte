<script lang="ts">
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser } from '$lib/global-state/user-state.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';
	import { cmToFeetInches, isHeightInCm } from '$lib/helpers/height-conversion';

	import type { DraftBoard, Prospect } from '$lib/types';
	import Card from './Card.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
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
	const formattedHeight = $derived(
		isHeightInCm(prospect.height) ? cmToFeetInches(prospect.height) : prospect.height
	);

	let dialogOpen = $state(false);

	function draft(prospect: Prospect, draftPosition: number) {
		draftSystem.addProspectToBoard(prospect, draftPosition);

		draftState.updateDraftStatus(false);

		if (!currentUser.user) {
			localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
		}

		// Close the dialog after drafting
		dialogOpen = false;
	}

	function undraft(prospect: Prospect) {
		// Find which position this prospect is drafted to
		const draftedPosition = draftSystem.draftBoard.find(
			(cell) => cell.prospect?.id === prospect.id
		);
		if (draftedPosition) {
			draftSystem.removeProspectFromBoard(prospect, draftedPosition.draftPosition);

			draftState.updateDraftStatus(false);

			if (!currentUser.user) {
				localStorage.setItem('draftBoard', JSON.stringify(draftboardToMap(draftSystem.draftBoard)));
			}
		}
	}
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Card
		size="md"
		class={`max-w-[360px] min-w-[265px] ${isDrafted ? 'border-dashed border-gray-500 bg-gray-50 opacity-50' : ''}`}
	>
		<div class="prospect-card pb4 relative flex h-full flex-col content-between gap-2 px-4">
			<!-- Header -->
			<div
				class="prospect-header mb-[15px] flex justify-between border-b-[3px] border-black pb-[10px]"
			>
				<p class="text-lg font-extrabold uppercase">
					{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}
				</p>

				<div class="flex gap-2">
					{#if isDrafted}
						<div
							class="flex items-center border-[2px] border-dashed border-gray-500 bg-red-400 px-[8px] py-[3px] text-sm font-extrabold text-gray-600"
						>
							<p>DRAFTED</p>
						</div>
					{/if}
					<div
						class="inline-block border-[3px] border-black px-[10px] py-[5px] text-lg font-extrabold"
					>
						<p>
							{#if prospect?.position === 'D' || prospect?.position === 'F'}
								{prospect?.shoots}{prospect?.position}
							{:else}
								{prospect?.position}
							{/if}
						</p>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="flex flex-1 flex-col">
				<div class="prospect-name mb-[5px] text-2xl font-extrabold uppercase">
					<p>
						{prospect?.name}
					</p>
				</div>

				<div class="prospect-team mb-[15px] -skew-x-3 bg-black px-2 py-[3px] font-bold text-white">
					<p>{prospect?.team} - {prospect?.league}</p>
				</div>

				<div
					class="prospect-details mt-[15px] flex flex-wrap gap-[15px] border-t-2 border-dashed border-black pt-[15px]"
				>
					{@render prospectStat(formattedHeight, 'Height')}
					{@render prospectStat(prospect?.weight, 'Weight')}
					{@render prospectStat(prospect?.birthDay, 'DOB')}
				</div>
			</div>

			<!-- Button at bottom -->
			<div class="mt-4 flex justify-center">
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

	<Dialog.Content
		class="shadow-button-shadow md:shadow-button-shadow max-w-[90%] rounded-none md:max-w-[50%] md:rounded-none"
	>
		<Dialog.Header class="md:mx-auto">
			<Dialog.Title>
				<h2
					class="mb-2 h-6 self-center pb-0 text-center text-[20px] font-extrabold text-black md:h-8 md:text-[28px]"
				>
					Who will be drafting {prospect.name}?
				</h2>
			</Dialog.Title>
		</Dialog.Header>

		<div class="flex max-h-[75dvh] flex-wrap justify-center gap-1 overflow-y-scroll pb-10 md:gap-2">
			{#each draftSystem.draftBoard as cell}
				{@render teamPicker(cell)}
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>

{#snippet teamPicker(cell: DraftBoard)}
	<button
		class={`flex h-20 w-20 flex-col content-center justify-center gap-1 border-[3px] border-black p-2 md:h-28 md:w-28 md:gap-2
		 ${!!cell?.prospect ? '' : 'hover:bg-primary'} ${!!cell?.prospect ? 'bg-neutral-400' : 'bg-white'}`}
		onclick={() => draft(prospect as Prospect, cell?.draftPosition)}
		disabled={!!cell?.prospect}
	>
		<h3
			class="mb-0 h-6 self-center pb-0 text-center text-[20px] font-extrabold text-black md:h-8 md:text-[28px]"
		>
			{cell?.draftPosition}
		</h3>
		<img class="w-16 self-center md:w-20" src={cell?.teamLogo} alt="team logo" />
	</button>
{/snippet}

<!-- PROSPECT DETAILS -->

{#snippet prospectStat(stat: string, label: string)}
	<div class="prospect-stat flex min-w-17 flex-1 flex-col">
		{@render statValue(stat, label)}
		{@render statLabel(label)}
	</div>
{/snippet}

{#snippet statValue(stat: string, label?: string)}
	<span class="stat-value font-extrabold">
		{#if label && label === 'Weight'}
			{stat} lbs
		{:else}
			{stat}
		{/if}
	</span>
{/snippet}

{#snippet statLabel(label: string)}
	<span class="stat-label text-xs tracking-[1px] uppercase">
		{label}
	</span>
{/snippet}
