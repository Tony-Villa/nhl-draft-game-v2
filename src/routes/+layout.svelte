<script lang="ts">
	import '../app.pcss';
	import '../tailwind.css';

	import { Toaster } from 'svelte-french-toast';
	import { setCurrentUser } from '$lib/globalState/userState.svelte';
	import * as Navbar from '$lib/components/navbar';

	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	let innerWidth = $state(0);
	
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
			<Navbar.Root user={data?.user?.user} isAuthenticated={data?.isAuthenticated} />
		{/if}
	</div>
	<!-- {#if draftBoard} -->
	{@render children()}
<!-- 		
	{/if} -->
</main>
