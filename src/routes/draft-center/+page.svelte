<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';
	import SliderSwitch from '$lib/components/SliderSwitch.svelte';
	// import Ladder from '$lib/components/Ladder.svelte';
	import HeadToHead from '$lib/components/HeadToHead.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import ShareDraft from '$lib/components/ShareDraft.svelte';

	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import { getDraftSystem, setDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser, setCurrentUser } from '$lib/global-state/user-state.svelte';
	import { setDraftState } from '$lib/global-state/draft-state.svelte';
	import { invalidateAll } from '$app/navigation';
	import { format, isAfter, } from 'date-fns';
	import Header from '$lib/components/Header.svelte';
	// import { PUBLIC_WEB_SOCKET } from '$env/static/public';
	import DataVizSidebar from '$lib/components/DataVizSidebar.svelte';
	import { env } from '$env/dynamic/public';

	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	let playersDrafted = $state(0);
	let draftBoard = $state(data.draftBoard);
	
	setCurrentUser(data?.user?.user);
	setDraftSystem(data.prospects, data.draftBoard, data.nhlBoard);
	setDraftState(data.game.gamePhase, data.game.draftDaySet, data.nhlBoard.filter((x: any) => x?.prospect?.name).length)

	const draftState = getDraftState();
	const draftSystem = getDraftSystem();
	const userState = getCurrentUser();

	let nhlDraftBoardLength = $state(data.nhlBoard.filter((x: any) => x?.prospect?.name).length)
	
	// Calculate next available pick position
	const nextAvailablePickPosition = $derived(() => {
		// Find the first position without a prospect
		const nextPosition = draftSystem.draftBoard.find(cell => !cell.prospect);
		return nextPosition ? nextPosition.draftPosition : 1;
	});


	// TODO: figure out local storage for unsubmitted drafts or users that haven't logged in yet.

	// function checkForSavedDraftBoard() {
	// 	playersDrafted = data.draftBoard.filter((draft: any) => draft.prospect).length;
	// }


	// function checkForLocalDraftBoard() {
	// 	if(globalThis) {
	// 		const localStorageDraft = JSON.parse(localStorage.getItem('draftBoard') || '{}')
	
	// 		checkForSavedDraftBoard();
	
	// 		if (playersDrafted === 0 && localStorageDraft.hasOwnProperty('draft')) {
	// 			storedDraftBoard.setNewInitialDraftBoard(localStorageDraft.draft);
				
	// 		} else {
	// 			draftBoard = data.draftBoard;
	// 		}
	
	// 		setDraftSystem(data.prospects, draftBoard, data.nhlBoard);
	// 	} else {
	// 		setDraftSystem(data.prospects, draftBoard, data.nhlBoard);
	// 	}
	// }

	// checkForLocalDraftBoard();

	let innerWidth = $state(0);
	let tabs = $derived(draftState.currentState !== "started" ? ['prospects', 'draftboard'] : ['draftboard', 'Nhl Draft']);
	let tabIndex = $state(0);
	let selectedTab = $derived(tabs[tabIndex]);


	const switchScreens = (tab: string) => {
		tabIndex = tabIndex === 1 ? 0 : 1;
	};

	// $effect(() => {
	// 	checkForSavedDraftBoard();
	// 	checkForLocalDraftBoard();
	// })

	$effect(() => {
		// setDraftState(data.game.gamePhase)
		// if(data.game.gamePhase !== draftState.currentState) {
			draftState.currentState = data.game.gamePhase
		// }
	})

	function refresh() {
		invalidateAll()
	}

	$effect(() => {
		if (draftState.currentState === "started") {

			if(nhlDraftBoardLength <= 31){

				const interval = setInterval(() => {
					refresh()

					draftState.currentNhlDraft = data.nhlBoard.filter((x: any) => x?.prospect?.name).length

					draftSystem.nhlDraftBoard = data.nhlBoard

					const totalPoints = draftSystem.computePoints()
					userState.points = totalPoints

					draftState.updateNhlDraftPick(nhlDraftBoardLength)

				}, 10000);
				() => {
					clearInterval(interval)
				}

			}
		}

		if (draftState.currentState === "finalized"){
			const totalPoints = draftSystem.computePoints()
			userState.points = totalPoints
		}
	})

</script>

<svelte:window bind:innerWidth />
<div class="mx-auto max-w-screen-2xl">
	{#if innerWidth < 768}
		<Header title="draft center" />
	{/if}

	{#if draftState.isDraftDaySet}
		{#if isAfter(new Date(data.game.startDate), Date.now())}
			<div class="flex flex-col text-center mb-6 gap-3">
				<Countdown heading="NHL Draft starts in:" endTime={data.game.startDate}>
					<div class="flex flex-col mt-2 leading-tight">
						<small>Note: Your draft will lock 16 hours<br/> before the official nhl draft</small>
						<small class="font-bold">
							{format(new Date(data?.game?.lockDate), 'iii, LLL do p')}
						</small>
					</div>
				</Countdown>
				<div>
					{#if env.PUBLIC_FEATURE_DATA_VIZ === '1'}
						<DataVizSidebar position={nextAvailablePickPosition()} gameId={data.game.id?.toString() || '2'} />
					{/if}
				</div>
			</div>

		{/if}
	{/if}
	
	
	{#if draftState.currentState === "started"}
	<div class="border-black border-2 rounded-xl shadow-brut-shadow max-w-fit px-4 py-2 bg-orange-100 mx-auto mb-6">
		<h2 class="mb-4 text-center text-2xl font-bold uppercase">Your Points:</h2>

		<div class="flex gap-2 justify-center font-bold border-black border-2 bg-blue-200 rounded-md p-4">
			<h2 class=" text-center text-6xl font-bold uppercase">{userState?.points}</h2>
		</div>
	</div>
	{/if}


	{#if draftState.currentState === "started" && data.nhlBoard}
		<HeadToHead currentPick={data.nhlBoard.filter((x: any) => x?.prospect?.name).length} />
	{/if}

	<!-- {#if draftState.currentState === "finalized"}
		<Ladder ladder={data?.ladder} />
	{/if} -->

	{#if draftState.currentState !== "started" && draftState.currentState !== 'locked' && draftState.currentState !== 'finalized'}
	
	<!-- Share Draft Button - Show when user has picks -->
	<div class="flex mb-3">
		<ShareDraft />
	</div>
	
	<div class=" flex gap-8 px-1">
		{#if innerWidth < 768}
			<div class="w-full pb-10">
				{#if selectedTab === tabs[1]}
					<DraftBoard draftType="user" />
				{:else if selectedTab === tabs[0]}
					<ProspectContainer />
				{/if}
			</div>
		{:else}
			<DraftBoard draftType="user" />
			<ProspectContainer />
		{/if}
</div>
	<!-- <div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-4 bg-white shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
	>
		<SliderSwitch switchVariable={switchScreens} left={tabs[0]} right={tabs[1]} />
	</div> -->
	{@render slider({left: tabs[0], right: tabs[1]})}
	{:else}
	
	<!-- Share Draft Button - Also show during/after draft -->
	<div class="flex mb-3">
		<ShareDraft />
	</div>
	
	<div class=" flex gap-5 px-2">
		{#if innerWidth < 768}
			<div class="w-full pb-10">
				{#if selectedTab === tabs[0]}
					<DraftBoard draftType="user" />
				{:else if selectedTab === tabs[1]}
					<DraftBoard draftType="nhl" nhlBoard={data.nhlBoard} />
				{/if}
			</div>
		{:else}
			<DraftBoard draftType="user" />
			<DraftBoard draftType="nhl" nhlBoard={data.nhlBoard} />
		{/if}
		</div>
		<!-- <div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-4 bg-white shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
		>
		<SliderSwitch switchVariable={switchScreens} left={tabs[0]} right={tabs[1]} />
		</div> -->
		{@render slider({left: tabs[0], right: tabs[1]})}
	{/if}
</div>


<svelte:head>
	<title>Hockey Draft Showdown</title>

	<meta property="og:title" content="Hockey Draft Showdown" />
	<meta property="og:description" content="Play against friends and strangers to see who can predict the first round of the official NHL draft" />
	<meta property="og:image" content="https://hockeydraftshowdown.com/og-image.jpg" />
	<meta property="og:url" content="https://hockeydraftshowdown.com/draft-center" />
	<meta property="og:type" content="website" />

</svelte:head>

{#snippet slider({left, right}: {left: string; right: string})}
	<div class="h-15 fixed bottom-0 flex w-full justify-center border-t-4 bg-white shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"> 
		<SliderSwitch switchVariable={switchScreens} left={left} right={right} />
	</div>
{/snippet}