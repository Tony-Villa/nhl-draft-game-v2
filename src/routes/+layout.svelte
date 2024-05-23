<script lang="ts">
	import '../app.pcss';
	import '../tailwind.css';

	import { Toaster } from 'svelte-french-toast';
	
	import { getDraftSystem, setDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import { setCurrentUser } from '$lib/globalState/userState.svelte';
	import { setDraftState } from '$lib/globalState/draftState.svelte';
	import * as Navbar from '$lib/components/navbar';

	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	
	let playersDrafted = $state(0);
	let draftBoard = $state(data.draftBoard);
	let innerWidth = $state(0);
	
	setCurrentUser(data?.user?.user);
	setDraftSystem(data.prospects, data.draftBoard, data.emptyDraftBoard);
	setDraftState()

	const storedDraftBoard = getDraftSystem()
	

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

		const draftSystem = setDraftSystem(data.prospects, draftBoard, data.emptyDraftBoard);
	}


	$effect(() => {
		checkForSavedDraftBoard();
		checkForLocalDraftBoard();
	})

</script>

<svelte:head>
	<title>Draft Center</title>
</svelte:head>
<svelte:window bind:innerWidth />

<main class="bg-[#FFF4E8] font-medium">
	<Toaster />
	<div >

		{#if innerWidth < 768}
			<Navbar.Small isAuthenticated={data?.isAuthenticated} />
		{:else}
			<Navbar.Root isAuthenticated={data?.isAuthenticated} />
		{/if}
	</div>
	{#if draftBoard}
	{@render children()}
		
	{/if}
</main>
