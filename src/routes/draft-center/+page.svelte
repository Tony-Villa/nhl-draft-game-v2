<script lang="ts">
	import ProspectContainer from '$lib/components/ProspectContainer.svelte';
	import DraftBoard from '$lib/components/DraftBoard.svelte';
	import SliderSwitch from '$lib/components/SliderSwitch.svelte';
	import Ladder from '$lib/components/Ladder.svelte';
	import HeadToHead from '$lib/components/HeadToHead.svelte';
	import Countdown from '$lib/components/Countdown.svelte';

	import { getDraftState } from '$lib/globalState/draftState.svelte';
	import { getDraftSystem, setDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { getCurrentUser, setCurrentUser } from '$lib/globalState/userState.svelte';
	import { setDraftState } from '$lib/globalState/draftState.svelte';
	import { invalidateAll } from '$app/navigation';
	import { format, isAfter, } from 'date-fns';
	// import { PUBLIC_WEB_SOCKET } from '$env/static/public';




	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	
	let playersDrafted = $state(0);
	let draftBoard = $state(data.draftBoard);
	
	

	// console.log('data: ', data);
	
	setCurrentUser(data?.user?.user);
	setDraftSystem(data.prospects, data.draftBoard, data.nhlBoard);
	setDraftState(data.game.gamePhase, data.nhlBoard.filter((x: any) => x?.prospect?.name).length)


	const storedDraftBoard = getDraftSystem()
	const draftState = getDraftState();
	const draftSystem = getDraftSystem();
	const userState = getCurrentUser();

	let nhlDraftBoardLength = $state(data.nhlBoard.filter((x: any) => x?.prospect?.name).length)


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

		setDraftSystem(data.prospects, draftBoard, data.nhlBoard);
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

	$effect(() => {
		// console.log(data.game.gamePhase);
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
					// console.log('before refresh: ', nhlDraftBoardLength);
					refresh()

					draftState.currentNhlDraft = data.nhlBoard.filter((x: any) => x?.prospect?.name).length

					draftSystem.nhlDraftBoard = data.nhlBoard


					// console.log('After refresh: ', data.nhlBoard.filter((x: any) => x?.prospect?.name).length);
					// console.log('After refresh NHL BOARD: ', data.nhlBoard);
					

					const totalPoints = draftSystem.computePoints()
					userState.points = totalPoints

					draftState.updateNhlDraftPick(nhlDraftBoardLength)

				}, 10000);
				() => {
					clearInterval(interval)
				}

			}


			// function connect() {
			// 	const socket = new WebSocket(PUBLIC_WEB_SOCKET)
			// 	// const socket = new WebSocket("http://localhost:3000/nhlDraftFeed")
			// 	const totalPoints = draftSystem.computePoints()
			// 	console.log('inside websocket before message:', totalPoints);
			// 	userState.points = totalPoints

			// 	socket.onopen = () => {
			// 		console.log("Connecting to WS");
			// 		console.log('send condition: ', draftSystem.nhlDraftBoard.filter(x => x?.prospect?.name).length <= 31);
			// 		if(draftSystem.nhlDraftBoard.filter(x => x?.prospect?.name).length <= 31){

			// 			const interval = setInterval(() => {
			// 				socket.send("start")
  		// 			}, 10000);
			// 			() => {
			// 				clearInterval(interval)
			// 			}

			// 		}
			// 		socket.onmessage = (event) => {

			// 			const totalPoints = draftSystem.computePoints()
			// 			console.log('inside websocket msg', totalPoints);
			// 			userState.points = totalPoints

			// 			let jsonData = JSON.parse(event.data)
			// 			if(jsonData){
			// 				draftState.updateNhlDraftPick(jsonData.length)
	
			// 				for(let i = 0; i < jsonData.length; i++) {
	
			// 					console.log('prospect drafted:', jsonData[i].name);
			// 					// draftSystem.addNhlPick(jsonData[i].prospect, i)
			// 						draftSystem.nhlDraftBoard[i].prospect = {
			// 							name: jsonData[i].name
			// 						} as any
			// 				}
			// 			} else {
			// 				draftState.updateNhlDraftPick(0)
			// 			}
		
			// 			// console.log(draftState.nhlDraft);
			// 		}
			// 		socket.onclose = function(e) {
			// 			console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
			// 			setTimeout(function() {
			// 				connect();
			// 			}, 1000);
			// 		};

			// 		socket.onerror = function(err) {
			// 			console.error('Socket encountered error: ', err, 'Closing socket');
			// 			socket.close();
			// 		};
			// 	}
			// }

			// connect()
		}

		if (draftState.currentState === "finalized"){
			const totalPoints = draftSystem.computePoints()
			userState.points = totalPoints
		}
	})

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
		</div>
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

	{#if draftState.currentState === "finalized"}
		<Ladder ladder={data?.ladder} />
	{/if}

	{#if draftState.currentState !== "started" && draftState.currentState !== 'locked' && draftState.currentState !== 'finalized'}
	<div class=" flex gap-5 px-2">
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
	<div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-2 bg-[#FFF4E8] shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
	>
		<SliderSwitch switchVariable={switchScreens} left={tabs[0]} right={tabs[1]} />
	</div>
	{:else}
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
		<div
		class="h-15 fixed bottom-0 flex w-full justify-center border-t-2 bg-[#FFF4E8] shadow-[0_-17px_20px_-25px_rgba(0,0,0,0.3)] md:hidden lg:hidden"
		>
		<SliderSwitch switchVariable={switchScreens} left={tabs[0]} right={tabs[1]} />
		</div>
	{/if}
</div>


<svelte:head>
	<title>Hockey Draft Showdown</title>
	<meta name="description" content="Play against friends and strangers to see who can predict the first round of the official NHL draft">
</svelte:head>