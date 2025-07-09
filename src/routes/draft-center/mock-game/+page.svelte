<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';
	import SliderSwitch from '$lib/components/SliderSwitch.svelte';
	import Card from '$lib/components/Card.svelte';
	import HeadToHead from '$lib/components/HeadToHead.svelte';

	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import { getDraftSystem, setDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser, setCurrentUser } from '$lib/global-state/user-state.svelte';
	import { setDraftState } from '$lib/global-state/draft-state.svelte';
	import Header from '$lib/components/Header.svelte';
	import DataVizSidebar from '$lib/components/DataVizSidebar.svelte';
	import Button from '$lib/components/Button.svelte';

	let { data }: { data: any } = $props();

	let mockDraftStarted = $state(false);
	let currentNhlPick = $state(1);
	let headToHeadPosition = $state(0);
	let mockDraftTimeout: ReturnType<typeof setTimeout> | null = $state(null);
	let isAutoSimulating = $state(false);
	let isProcessingPick = $state(false);
  let mockDraftCardOpen = $state(true);

  console.log('Mock Draft Game Data:', data);
	
	setCurrentUser(data?.user?.user);
	setDraftSystem(data.prospects, data.draftBoard, data.nhlBoard);
	setDraftState('mock', data.game.draftDaySet, 0);

	const draftState = getDraftState();
	const draftSystem = getDraftSystem();
	const userState = getCurrentUser();

	let innerWidth = $state(0);
	let tabs = $derived(mockDraftStarted ? ['draftboard', 'nhl draft'] : ['prospects', 'draftboard']);
	let tabIndex = $state(0);
	let selectedTab = $derived(tabs[tabIndex]);

	const nextAvailablePickPosition = $derived(() => {
		const nextPosition = draftSystem.draftBoard.find(cell => !cell.prospect);
		return nextPosition ? nextPosition.draftPosition : 1;
	});

	const switchScreens = (tab: string) => {
		tabIndex = tabIndex === 1 ? 0 : 1;
	};

	function scheduleNextPick() {
		if (!isAutoSimulating || currentNhlPick > 32) {
			return;
		}
		
		headToHeadPosition = currentNhlPick - 1;
		
		setTimeout(() => {
			simulateNhlPick();
		}, 5000);
		
		if (isAutoSimulating && currentNhlPick <= 32) {
			mockDraftTimeout = setTimeout(scheduleNextPick, 4000);
		}
	}
	function simulateNhlPick() {
		if (currentNhlPick > 32 || isProcessingPick) {
			if (currentNhlPick > 32) {
				stopMockDraft();
			}
			return;
		}

		isProcessingPick = true;

		const pickIndex = currentNhlPick - 1;
		const nhlPick = data.randomizedNhlDraft[pickIndex];

		if (nhlPick && nhlPick.prospect) {
			const selectedProspect = {
				id: nhlPick.prospect.id,
				rank: nhlPick.prospect.rank || '0',
				name: nhlPick.prospect.name,
				position: nhlPick.prospect.position || undefined,
				nation: nhlPick.prospect.nation || undefined,
				team: nhlPick.prospect.team,
				league: nhlPick.prospect.league,
				birthDay: nhlPick.prospect.birthDay,
				height: nhlPick.prospect.height?.toString() || '',
				weight: nhlPick.prospect.weight?.toString() || '',
				shoots: nhlPick.prospect.shoots
			};
			
			const updatedNhlBoard = [...draftSystem.nhlDraftBoard];
			
			if (updatedNhlBoard[pickIndex]) {
				updatedNhlBoard[pickIndex] = {
					...updatedNhlBoard[pickIndex],
					prospect: selectedProspect
				};
			}
			
			draftSystem.nhlDraftBoard = updatedNhlBoard;
			
			draftState.updateNhlDraftPick(currentNhlPick);
			
			const totalPoints = draftSystem.computePoints();
			userState.points = totalPoints;
			
			draftSystem.draftBoard = [...draftSystem.draftBoard];
			
			currentNhlPick += 1;
		}

		setTimeout(() => {
			isProcessingPick = false;
		}, 100);
	}

	function startMockDraft() {
		if (mockDraftStarted) return;
		
		mockDraftStarted = true;
		currentNhlPick = 1;
		headToHeadPosition = 0;
		isAutoSimulating = true;
		tabIndex = 0; 
		
		const resetNhlBoard = data.nhlBoard.map((position: any) => ({
			...position,
			prospect: null
		}));
		draftSystem.nhlDraftBoard = resetNhlBoard;
		draftState.updateNhlDraftPick(0);
		
		scheduleNextPick();
	}

	function stopMockDraft() {
		isAutoSimulating = false;
		if (mockDraftTimeout) {
			clearTimeout(mockDraftTimeout);
			mockDraftTimeout = null;
		}
		
		if (currentNhlPick > 32) {
			draftState.currentState = 'finalized';
		}
	}

	function resetMockDraft() {
		stopMockDraft();
		mockDraftStarted = false;
		currentNhlPick = 1;
		tabIndex = 0; 
		isProcessingPick = false;
		
		const resetNhlBoard = data.nhlBoard.map((position: any) => ({
			...position,
			prospect: null
		}));
		draftSystem.nhlDraftBoard = resetNhlBoard;
		draftState.updateNhlDraftPick(0);
		draftState.currentState = 'mock';
		userState.points = 0;
		headToHeadPosition = 0;
	}

	$effect(() => {
		return () => {
			if (mockDraftTimeout) {
				clearTimeout(mockDraftTimeout);
			}
		};
	});
</script>

<svelte:window bind:innerWidth />
<div class="mx-auto max-w-screen-2xl">
	{#if innerWidth < 768}
		<a  href="/draft-center">
        <Header title="draft center" />
    </a>
	{/if}

	<div class="mx-4 flex flex-col gap-4 md:mx-8 transition-[height]">
		<Card>
			<div class="p-6">
        <div class="flex justify-between">
          <button 
          class="w-full flex items-baseline gap-5 p-4 text-left"
          onclick={() => mockDraftCardOpen = !mockDraftCardOpen}
          >
            <h1 class="text-2xl font-bold text-gray-900">Mock Draft Game</h1>
            <span class="text-2xl font-bold transform transition-transform duration-200 {mockDraftCardOpen ? 'rotate-180' : ''}">
              ▼
            </span>
			    </button>
        </div>

        {#if mockDraftCardOpen}
				<p class="text-gray-600 mb-4">
					Practice with prospects from the {data.finalizedGameYear} draft. Make your picks, then simulate the NHL draft to see how you score!
				</p>
				
				<div class="flex flex-wrap gap-3">				
					{#if !mockDraftStarted}
						<Button 
							onclick={startMockDraft}
							variant="primary"
							disabled={draftSystem.draftBoard.filter((pick: any) => pick.prospect).length === 0}
						>
							Start Mock NHL Draft
						</Button>
					{/if}
					
					<Button 
						onclick={resetMockDraft}
            variant="outline"
					>
						Reset
					</Button>
				</div>

				{#if mockDraftStarted}
					<div class="mt-4 p-3 bg-blue-50 rounded-lg">
						<p class="text-sm text-blue-800">
							{#if currentNhlPick <= 32}
								Mock NHL Draft in progress... Next pick: #{currentNhlPick}
								{#if userState.points !== undefined}
									| Your current score: {userState.points} points
								{/if}
							{:else}
								Mock NHL Draft completed! Final score: {userState.points || 0} points
							{/if}
						</p>
					</div>
				{/if}

				{#if draftSystem.draftBoard.filter((pick: any) => pick.prospect).length === 0}
					<div class="mt-4 p-3 bg-yellow-50 rounded-lg">
						<p class="text-sm text-yellow-800">
							Make some draft picks before starting the mock NHL draft!
						</p>
						<p class="text-sm text-yellow-800">
							Note: All your picks will reset if you reload your page.
						</p>
					</div>
				{/if}

        {/if}
			</div>
		</Card>

		{#if mockDraftStarted}
			<Card class="max-w-fit mx-auto mb-6 shadow-brut-shadow bg-white">
				<div class="text-center">
					<h2 class="mb-3 text-xl font-bold uppercase tracking-wide">Your Score</h2>
					<Card class="bg-white inline-block shadow-brut-shadow-sm">
						<div class="px-6 py-3">
							<span class="text-5xl font-bold text-primary">{userState?.points || 0}</span>
							<p class="text-sm font-semibold mt-1 text-gray-700">Points</p>
						</div>
					</Card>
				</div>
			</Card>

			<HeadToHead currentPick={headToHeadPosition} isMockGame={true} />
		{/if}

		{#if !mockDraftStarted}
			<div class="flex justify-center mb-4">
				<DataVizSidebar position={nextAvailablePickPosition()} gameId={data.game.id.split('-')[1]} />
			</div>
		{/if}

		{#if innerWidth < 768}
			<div class="flex">
				<SliderSwitch 
					left={tabs[0]}
					right={tabs[1]}
					switchVariable={switchScreens}
				/>
			</div>
		{/if}

		{#if innerWidth >= 768}
			<div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
				{#if !mockDraftStarted}
					<div class="lg:col-span-5">
						<Card>
							<div class="p-4">
								<h2 class="text-lg font-semibold mb-4">Your Mock Draft Board</h2>
								<DraftBoard draftType="user" />
							</div>
						</Card>
					</div>

					<div class="lg:col-span-7">
						<Card>
							<div class="p-4">
								<h2 class="text-lg font-semibold mb-4">Available Prospects ({data.finalizedGameYear})</h2>
								<ProspectContainer />
							</div>
						</Card>
					</div>
				{:else}
					<div class="lg:col-span-6">
						<Card>
							<div class="p-4">
								<h2 class="text-lg font-semibold mb-4">Your Mock Draft Board</h2>
								<DraftBoard draftType="user" />
							</div>
						</Card>
					</div>

					<div class="lg:col-span-6">
						<Card>
							<div class="p-4">
								<h2 class="text-lg font-semibold mb-4">NHL Mock Draft Board</h2>
								<DraftBoard draftType="nhl" nhlBoard={draftSystem.nhlDraftBoard} />
							</div>
						</Card>
					</div>
				{/if}
			</div>


		{:else}
			{#if !mockDraftStarted}
				{#if selectedTab === 'prospects'}
					<Card>
						<div class="p-4">
							<h2 class="text-lg font-semibold mb-4">Available Prospects ({data.finalizedGameYear})</h2>
							<ProspectContainer />
						</div>
					</Card>
				{:else}
					<Card>
						<div class="p-4">
							<h2 class="text-lg font-semibold mb-4">Your Mock Draft Board</h2>
							<DraftBoard draftType="user" />
						</div>
					</Card>
				{/if}
			{:else}
				{#if selectedTab === 'draftboard'}
					<Card>
						<div class="p-4">
							<h2 class="text-lg font-semibold mb-4">Your Mock Draft Board</h2>
							<DraftBoard draftType="user" />
						</div>
					</Card>
				{:else}
					<Card>
						<div class="p-4">
							<h2 class="text-lg font-semibold mb-4">NHL Mock Draft Board</h2>
							<DraftBoard draftType="nhl" nhlBoard={draftSystem.nhlDraftBoard} />
						</div>
					</Card>
				{/if}
			{/if}
		{/if}
	</div>
</div>
