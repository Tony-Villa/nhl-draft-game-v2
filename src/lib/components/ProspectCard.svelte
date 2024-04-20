<script lang="ts">
	import { getDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { getCurrentUser } from '$lib/globalState/userState.svelte';
	import { draftboardToMap } from '$lib/helpers/draftboard-to-map';

	import type { Prospect } from '$lib/types';
	import Card from './Card.svelte';
	import * as Drawer from "$lib/components/ui/drawer/index.js";
	import { getDraftState } from '$lib/globalState/draftState.svelte';

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


<Drawer.Root>
	<Card variant='small'>
		<div class="prospect-card relative flex w-48 flex-col content-between gap-2 pb-4 px-4 min-h-[235px] h-full md:w-52 max-[430px]:w-44 max-[399px]:w-[160px]">
			<img
				src={prospect?.nation}
				alt="nationality"
				class="flag absolute left-0 top-0 w-10 object-cover opacity-40"
			/>
	
			<div class="flex justify-between">
				<p class="font-semibold">{prospect?.rank !== '-' ? 'Rank: ' + prospect?.rank : 'NR'}</p>
				<div class="flex content-end justify-end gap-2 text-xs opacity-55">
					<p>{prospect?.position}</p>
					<p>|</p>
					<p>{prospect?.shoots}</p>
				</div>
			</div>
	
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
						<Drawer.Trigger>
							<div class={`border-2 shadow-brut-shadow-sm rounded-md border-solid border-black px-3 py-1 relative 
						bg-yellow-400 font-semibold`}>Draft</div>
						</Drawer.Trigger>
					</div>
				</div>
			</div>
		</div>
	</Card>
	<Drawer.Content class='bg-[#FFF4E8]'>
    <Drawer.Header class='md:mx-auto'>
      <Drawer.Title>Who will be drafting {prospect.name}?</Drawer.Title>
    </Drawer.Header>

		<div class="flex flex-wrap justify-center gap-2 pb-10 md:max-w-[600px] md:mx-auto">
			{#each draftSystem.draftBoard as cell}
				{@render teamPicker(cell)}
			{/each}
		</div>

  </Drawer.Content>
</Drawer.Root>



{#snippet teamPicker(cell)}
	<button
		class={`flex flex-col content-center justify-center gap-2 border border-black rounded-md p-2 w-20 h-20 md:w-28 md:h-28
		 ${!!cell?.prospect ? '' : 'hover:bg-[#f2dabd]'} ${!!cell?.prospect ? 'bg-neutral-400' : 'bg-orange-100'}`}
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
