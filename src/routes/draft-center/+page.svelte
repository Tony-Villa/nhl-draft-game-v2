<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';
	import SliderSwitch from '$lib/components/SliderSwitch.svelte';
	import Ladder from '$lib/components/Ladder.svelte';
	import HeadToHead from '$lib/components/HeadToHead.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import ShareDraft from '$lib/components/ShareDraft.svelte';
	import BoardSwitcher from '$lib/components/BoardSwitcher.svelte';
	import Card from '$lib/components/Card.svelte';

	import { getDraftState } from '$lib/global-state/draft-state.svelte';
	import { getDraftSystem, setDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser, setCurrentUser } from '$lib/global-state/user-state.svelte';
	import { setDraftState } from '$lib/global-state/draft-state.svelte';
	import { invalidateAll } from '$app/navigation';
	import { format, isAfter } from 'date-fns';
	import Header from '$lib/components/Header.svelte';
	import DataVizSidebar from '$lib/components/DataVizSidebar.svelte';
	import LiveLeaderboard from '$lib/components/LiveLeaderboard.svelte';
	import { env } from '$env/dynamic/public';
	import { buttonOptions } from '$lib/components/Button.options';
	import { untrack } from 'svelte';

	let { data }: { data: any } = $props();

	const initialData = untrack(() => data);

	setCurrentUser(initialData?.user?.user);
	setDraftSystem(initialData.prospects, initialData.draftBoard, initialData.nhlBoard);
	setDraftState(
		initialData.game.gamePhase,
		initialData.game.draftDaySet,
		initialData.nhlBoard.filter((x: any) => x?.prospect?.name).length
	);

	const draftState = getDraftState();
	const draftSystem = getDraftSystem();
	const userState = getCurrentUser();

	let nhlDraftBoardLength = $state(
		initialData.nhlBoard.filter((x: any) => x?.prospect?.name).length
	);
	let leaderboardOpen = $state(false);

	// Calculate next available pick position
	const nextAvailablePickPosition = $derived(() => {
		// Find the first position without a prospect
		const nextPosition = draftSystem.draftBoard.find((cell) => !cell.prospect);
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
	let tabs = $derived(
		draftState.currentState === 'open' ? ['prospects', 'draftboard'] : ['draftboard', 'Nhl Draft']
	);
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
		draftState.currentState = data.game.gamePhase;
		// }
	});

	function refresh() {
		invalidateAll();
	}

	// Optimized polling for live draft updates
	async function checkForUpdates() {
		try {
			const response = await fetch(`/api/draft-updates?game=${data.game.id}`);
			const updates = await response.json();

			// Only update if there are new picks
			if (updates.totalPicks !== nhlDraftBoardLength) {
				// Create updated NHL board by merging picks into existing structure
				const updatedNhlBoard = [...data.nhlBoard];

				updates.picks.forEach((pick: any) => {
					const boardIndex = pick.draftPosition - 1;
					if (updatedNhlBoard[boardIndex]) {
						updatedNhlBoard[boardIndex] = {
							...updatedNhlBoard[boardIndex],
							prospect: pick.prospect
						};
					}
				});

				// Update the draft system with new NHL board
				draftSystem.nhlDraftBoard = updatedNhlBoard;

				// Update local state
				nhlDraftBoardLength = updates.totalPicks;
				draftState.currentNhlDraft = updates.totalPicks;

				// Compute new points
				const totalPoints = draftSystem.computePoints();
				userState.points = totalPoints;

				draftState.updateNhlDraftPick(nhlDraftBoardLength);

				// Update scores in database for all users (only if user is logged in)
				if (
					userState?.user &&
					typeof userState.user === 'object' &&
					'id' in userState.user &&
					userState.user.id
				) {
					try {
						await fetch('/api/score');
					} catch (error) {
						console.error('Failed to update scores:', error);
					}
				}
			}

			// Update game phase if changed
			if (updates.gamePhase !== draftState.currentState) {
				draftState.currentState = updates.gamePhase;
			}
		} catch (error) {
			console.error('Failed to fetch updates:', error);
			// Fallback to full refresh on error
			refresh();
		}
	}

	$effect(() => {
		if (draftState.currentState === 'started') {
			if (nhlDraftBoardLength <= 31) {
				const interval = setInterval(() => {
					checkForUpdates(); // Use optimized polling instead of full refresh
				}, 5000); // Reduced to 5 seconds for better UX

				return () => {
					clearInterval(interval);
				};
			}
		}

		if (draftState.currentState === 'finalized') {
			const totalPoints = draftSystem.computePoints();
			userState.points = totalPoints;
		}
	});
</script>

<svelte:window bind:innerWidth />
<div class="mx-auto max-w-screen-2xl">
	{#if innerWidth < 768}
		<Header title="draft center" />
	{/if}

	{#if draftState.isDraftDaySet}
		{#if draftState.currentState === 'open' && isAfter(new Date(data.game.lockDate), Date.now())}
			<div class="mb-6 flex flex-col gap-3 text-center">
				<Countdown heading="Draft locks in:" endTime={data.game.lockDate}>
					<div class="mt-2 flex flex-col leading-tight">
						<small>Draft locks at:</small>
						<small class="font-bold">
							{format(new Date(data?.game?.lockDate), 'iii, LLL do p')}
						</small>
						<small class="mt-2">NHL Draft starts at:</small>
						<small class="font-bold">
							{format(new Date(data?.game?.startDate), 'iii, LLL do p')}
						</small>
					</div>
				</Countdown>
				{#if draftState.currentState === 'open'}
					<div>
						{#if env.PUBLIC_FEATURE_DATA_VIZ === '1'}
							<DataVizSidebar
								position={nextAvailablePickPosition()}
								gameId={data.game.id?.toString() || '2'}
							/>
						{/if}
					</div>
				{/if}
			</div>
		{:else if draftState.currentState === 'locked' && isAfter(new Date(data.game.startDate), Date.now())}
			<div class="mb-6 flex flex-col gap-3 text-center">
				<Countdown heading="NHL Draft starts in:" endTime={data.game.startDate}>
					<div class="mt-2 flex flex-col leading-tight">
						<small>Draft is locked - no more changes allowed</small>
						<small class="mt-2">NHL Draft starts at:</small>
						<small class="font-bold">
							{format(new Date(data?.game?.startDate), 'iii, LLL do p')}
						</small>
					</div>
				</Countdown>
			</div>
		{/if}
	{/if}

	{#if draftState.currentState === 'started'}
		<!-- User Points Display -->
		<Card class="shadow-brut-shadow mx-auto mb-6 max-w-fit bg-white">
			<div class="text-center">
				<h2 class="mb-3 text-xl font-bold tracking-wide uppercase">Your Score</h2>
				<Card class="shadow-brut-shadow-sm inline-block bg-white">
					<div class="px-6 py-3">
						<span class="text-primary text-5xl font-bold">{userState?.points || 0}</span>
						<p class="mt-1 text-sm font-semibold text-gray-700">Points</p>
					</div>
				</Card>
			</div>
		</Card>

		<!-- Head-to-Head - Only show during started phase -->
		{#if data.nhlBoard}
			<HeadToHead currentPick={data.nhlBoard.filter((x: any) => x?.prospect?.name).length} />
		{/if}

		<!-- Collapsible Leaderboard -->
		<div class="mx-auto mb-6 max-w-fit">
			<Card class="shadow-brut-shadow bg-white">
				<button
					class="flex w-full items-center justify-between p-4 text-left"
					onclick={() => (leaderboardOpen = !leaderboardOpen)}
				>
					<h3 class="text-lg font-bold tracking-wide uppercase">Live Leaderboard</h3>
					<span
						class="transform text-2xl font-bold transition-transform duration-200 {leaderboardOpen
							? 'rotate-180'
							: ''}"
					>
						▼
					</span>
				</button>
				{#if leaderboardOpen}
					<div class="border-t-[3px] border-black px-4 pb-4">
						<LiveLeaderboard gameId={data.game.id?.toString() || '1'} />
					</div>
				{/if}
			</Card>
		</div>
	{:else if draftState.currentState === 'finalized'}
		<!-- Final Score Display -->
		<Card class="shadow-brut-shadow mx-auto mb-6 max-w-fit bg-white">
			<div class="text-center">
				<h2 class="mb-3 text-xl font-bold tracking-wide uppercase">Final Score</h2>
				<Card class="shadow-brut-shadow-sm inline-block bg-white">
					<div class="px-6 py-3">
						<span class="text-primary text-5xl font-bold">{userState?.points || 0}</span>
						<p class="mt-1 text-sm font-semibold text-gray-700">Points</p>
					</div>
				</Card>
			</div>
		</Card>

		<Card class="shadow-brut-shadow mx-auto mb-6 max-w-2xl bg-white">
			<div class="p-6 text-center">
				<h2 class="mb-3 text-xl font-bold tracking-wide uppercase">Want to Keep Playing?</h2>
				<p class="mb-4 text-gray-600">
					While we wait for next season, try the Mock Draft Game! Practice with this year's
					prospects and see how you would have scored.
				</p>
				<a href="/draft-center/mock-game" class={buttonOptions({ variant: 'primary', size: 'lg' })}>
					Play Mock Draft Game
				</a>
			</div>
		</Card>

		<!-- Final Ladder/Results -->
		{#if data?.ladder}
			<Ladder ladder={data.ladder} />
		{/if}
	{/if}

	<!-- {#if draftState.currentState === "finalized"}
		<Ladder ladder={data?.ladder} />
	{/if} -->

	{#if draftState.currentState !== 'started' && draftState.currentState !== 'locked' && draftState.currentState !== 'finalized'}
		<!-- Share Draft Button - Show when user has picks -->
		<div
			class="mb-3 flex flex-col items-start justify-between gap-3 px-1 sm:flex-row sm:items-center"
		>
			<ShareDraft />
			{#if data.leaguesAndBoardsEnabled}
				<BoardSwitcher
					selectedBoard={data.selectedDraftBoard}
					boards={data.userDraftBoards}
					canSwitch={data.canSwitchDraftBoards}
				/>
			{/if}
		</div>

		<div class=" flex gap-8 px-1">
			{#if innerWidth < 768}
				<div class="w-full pb-10">
					{#if selectedTab === tabs[1]}
						<DraftBoard draftType="user" />
					{:else if selectedTab === tabs[0]}
						<ProspectContainer year={Number(data.game.year)} />
					{/if}
				</div>
			{:else}
				<DraftBoard draftType="user" />
				<ProspectContainer year={Number(data.game.year)} />
			{/if}
		</div>
		<!-- <div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-4 bg-white shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
	>
		<SliderSwitch switchVariable={switchScreens} left={tabs[0]} right={tabs[1]} />
	</div> -->
		{@render slider({ left: tabs[0], right: tabs[1] })}
	{:else}
		<!-- Share Draft Button - Also show during/after draft -->
		<div
			class="mb-3 flex flex-col items-start justify-between gap-3 px-2 sm:flex-row sm:items-center"
		>
			<ShareDraft />
			{#if data.leaguesAndBoardsEnabled}
				<BoardSwitcher
					selectedBoard={data.selectedDraftBoard}
					boards={data.userDraftBoards}
					canSwitch={data.canSwitchDraftBoards}
				/>
			{/if}
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
		{@render slider({ left: tabs[0], right: tabs[1] })}
	{/if}
</div>

<svelte:head>
	<title>Hockey Draft Showdown</title>

	<meta property="og:title" content="Hockey Draft Showdown" />
	<meta
		property="og:description"
		content="Play against friends and strangers to see who can predict the first round of the official NHL draft"
	/>
	<meta property="og:image" content="https://hockeydraftshowdown.com/og-image.jpg" />
	<meta property="og:url" content="https://hockeydraftshowdown.com/draft-center" />
	<meta property="og:type" content="website" />
</svelte:head>

{#snippet slider({ left, right }: { left: string; right: string })}
	<div
		class="fixed bottom-0 z-50 flex h-15 w-full justify-center border-t-4 bg-white shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
	>
		<SliderSwitch switchVariable={switchScreens} {left} {right} />
	</div>
{/snippet}
