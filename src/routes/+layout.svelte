<script lang="ts">
	import '../app.pcss';
	import '../tailwind.css';

	import {page} from '$app/stores'
	import { Toaster } from 'svelte-french-toast';
	import { setCurrentUser } from '$lib/globalState/userState.svelte';
	import * as Navbar from '$lib/components/navbar';
	import TitleBanner from '$lib/components/ctpDraft/TitleBanner.svelte';
	import ThemeToggle from '$lib/components/ctpDraft/ThemeToggle.svelte';

	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	let innerWidth = $state(0);
	
</script>


<svelte:window bind:innerWidth />

{#if $page.url.pathname.includes('ctp')}
<div class="toggle">
	<ThemeToggle />
</div>
<TitleBanner />
{@render children()}

{:else}
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
{/if}


<style lang="postcss">
	.toggle {
		margin: 10px 0 0 10px;
	}
</style>