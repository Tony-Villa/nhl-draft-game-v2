<script lang="ts">
	import '../app.pcss';
	import '../app.pcss';
	import { getDraftSystem, setDraftSystem } from '$lib/globalState/prospectsState.svelte';
	import '../app.pcss';
	import '../tailwind.css';
	import { setCurrentUser } from '$lib/globalState/userState.svelte';
	import Google from '$lib/icons/Google.svelte';
	import Discord from '$lib/icons/Discord.svelte';
	import { setDraftState } from '$lib/globalState/draftState.svelte';

	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	
	let playersDrafted = $state(0);
	let draftBoard = $state(data.draftBoard);
	
	setCurrentUser(data?.user?.user);
	setDraftSystem(data.prospects, data.draftBoard);
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

		const draftSystem = setDraftSystem(data.prospects, draftBoard);
	}


	$effect(() => {
		checkForSavedDraftBoard();
		checkForLocalDraftBoard();
	})

	function clearLocalDraft() {
		localStorage.removeItem('draftBoard');
	}

	const baseButtonStyles = 'border-2 shadow-brut-shadow-sm rounded-md border-solid border-black px-3 py-1 relative';
</script>

<svelte:head>
	<title>Draft Center</title>
</svelte:head>

<main class="bg-[#FFF4E8] font-medium">
	<nav class="flex flex-row justify-end items-center py-3 mx-3 md:mx-10 ">
	{#if data.isAuthenticated}
			<ul class="flex flex-row flex-end">
				<form method="post" action="/draft-center?/logout">
					<button onclick={clearLocalDraft}>Sign out</button>
				</form>
			</ul>
	{:else}
	<ul class="flex flex-row flex-end gap-5 items-center">
				<p>Sign in with </p>
					<a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/google">
						<Google />
						Google
					</a>
					<a class={`${baseButtonStyles} flex gap-1 justify-center items-center hover:bg-yellow-500`} href="/auth/login/discord">
						<Discord />
						Discord
					</a>
			</ul>
			{/if}
	</nav>
	{#if draftBoard}
	{@render children()}
		
	{/if}
</main>
