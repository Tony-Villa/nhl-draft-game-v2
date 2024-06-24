<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';
	import SliderSwitch from '$lib/components/SliderSwitch.svelte';
	import { getDraftState } from '$lib/globalState/draftState.svelte';
	import { getDraftSystem, setDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { setCurrentUser } from '$lib/globalState/userState.svelte';
	import { setDraftState } from '$lib/globalState/draftState.svelte';
	import HeadToHead from '$lib/components/HeadToHead.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
	import {  invalidateAll } from '$app/navigation';
	import {  format, isAfter, } from 'date-fns';



	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	
	let playersDrafted = $state(0);
	let draftBoard = $state(data.draftBoard);

	console.log('data: ', data);
	
	setCurrentUser(data?.user?.user);
	setDraftSystem(data.prospects, data.draftBoard, data.emptyDraftBoard);
	setDraftState(data.game.gamePhase)


	const storedDraftBoard = getDraftSystem()
	const draftState = getDraftState();
	const draftSystem = getDraftSystem();
	

	function checkForSavedDraftBoard() {
		playersDrafted = data.draftBoard.filter((draft: any) => draft.prospect).length;
	}

	function checkForLocalDraftBoard() {
		const localStorageDraft =  JSON.parse(localStorage.getItem('draftBoard') || '{}')

		if (playersDrafted === 0 && localStorageDraft.hasOwnProperty('draft')) {
			storedDraftBoard.setNewInitialDraftBoard(localStorageDraft.draft);
			
		} else {
			draftBoard = data.draftBoard;
		}

		setDraftSystem(data.prospects, draftBoard, data.emptyDraftBoard);
	}

	let innerWidth = $state(0);
	let tabs = $derived(draftState.currentState !== "started" ? ['prospects', 'draftboard'] : ['draftboard', 'Nhl Draft']);
	let tabIndex = $state(0);
	let selectedTab = $derived(tabs[tabIndex]);


	const switchScreens = (tab: string) => {
		tabIndex = tabIndex === 1 ? 0 : 1;
	};

	$effect(() => {
		checkForSavedDraftBoard();
		checkForLocalDraftBoard();
	})

	// $effect(() => {
	// 	// setDraftState(data.game.gamePhase)
	// 	if(data.game.gamePhase !== draftState.currentState) {
	// 		draftState.currentState = data.game.gamePhase
	// 	}
	// })

	$effect(() => {
		if (draftState.currentState === "started") {
			const socket = new WebSocket("ws://localhost:3000/nhlDraftFeed")
			socket.onopen = () => {
				console.log("Connecting to WS");
				socket.send("start")
				socket.onmessage = (event) => {
					let jsonData = JSON.parse(event.data)
					if(jsonData){
						draftState.updateNhlDraftPick(jsonData.length)

						for(let i = 0; i < jsonData.length; i++) {
								draftSystem.nhlDraftBoard[i].prospect = {
									name: jsonData[i].name
								} as any
						}
					} else {
						draftState.updateNhlDraftPick(0)
					}
	
					// console.log(draftState.nhlDraft);
				}
			}
		}
	})


	function refresh() {
		invalidateAll()
	}


</script>

<svelte:window bind:innerWidth />
<div class="mx-auto max-w-screen-2xl">
	<h1 class="mb-4 text-center text-6xl font-bold uppercase">draft center</h1>

	{#if isAfter(new Date(data.game.startDate), Date.now())}
		<div class="text-center mb-6">
			<Countdown heading="NHL Draft starts in:" endTime={data.game.startDate}>
				<div class="flex flex-col mt-2 leading-tight">
					<small>Note: Your draft will lock 16 hours<br/> before the official nhl draft</small>
					<small class="font-bold">
						{format(new Date(data?.game?.lockDate), 'iii, LLL do p')}
					</small>
				</div>
			</Countdown>
			<!-- <Countdown endTime={"2024-06-21T09:05:30Z"} /> -->
		</div>
	{/if}
	
	{#if draftState.currentState === "started"}
		<HeadToHead />
	{/if}

	{#if draftState.currentState !== "started"}
	<div class=" flex gap-5 px-2">
		{#if innerWidth < 768}
			<div class="w-full pb-10">
				{#if selectedTab === tabs[1]}
					<DraftBoard lockDate={data?.game?.lockDate} draftType="user" />
				{:else if selectedTab === tabs[0]}
					<ProspectContainer />
				{/if}
			</div>
		{:else}
			<DraftBoard lockDate={data?.game?.lockDate} draftType="user" />
			<ProspectContainer />
		{/if}
	</div>
	<div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-2 bg-[#FFF4E8] shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
	>
		<SliderSwitch switchVariable={switchScreens} left={tabs[0]} right={tabs[1]} />
	</div>
	{:else}
	<div class=" flex gap-5 px-2">
		{#if innerWidth < 768}
			<div class="w-full pb-10">
				{#if selectedTab === tabs[1]}
					<DraftBoard lockDate={data.game.lockDate} draftType="user" />
				{:else if selectedTab === tabs[0]}
					<DraftBoard draftType="nhl" />
				{/if}
			</div>
		{:else}
			<DraftBoard lockDate={data.game.lockDate} draftType="user" />
			<DraftBoard draftType="nhl" />
		{/if}
		</div>
		<div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-2 bg-[#FFF4E8] shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
		>
		<SliderSwitch switchVariable={switchScreens} left={tabs[0]} right={tabs[1]} />
		</div>
	{/if}
</div>
