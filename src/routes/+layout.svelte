<script lang="ts">
	import '../app.css';

	import { page } from '$app/stores';
	import { Toaster } from 'svelte-french-toast';
	import * as Navbar from '$lib/components/navbar';
	import TitleBanner from '$lib/components/ctpDraft/TitleBanner.svelte';
	import ThemeToggle from '$lib/components/ctpDraft/ThemeToggle.svelte';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';

	let {
		children,
		data
	}: {
		children: any;
		data: any;
	} = $props();

	let innerWidth = $state(0);
</script>

<svelte:window bind:innerWidth />
<NavigationProgress />

{#if $page.url.pathname.includes('ctp')}
	<div class="toggle">
		<ThemeToggle />
	</div>
	<TitleBanner />
	{@render children()}
{:else}
	<main class="bg-offWhite font-medium">
		<Toaster />
		<div>
			{#if innerWidth < 1024}
				<Navbar.Small
					isAuthenticated={data?.isAuthenticated}
					leaguesAndBoardsEnabled={data?.leaguesAndBoardsEnabled}
				/>
			{:else}
				<Navbar.Root
					user={data?.user?.user}
					isAuthenticated={data?.isAuthenticated}
					leaguesAndBoardsEnabled={data?.leaguesAndBoardsEnabled}
				/>
			{/if}
		</div>
		{@render children()}
	</main>
{/if}

<style lang="postcss">
	.toggle {
		margin: 10px 0 0 10px;
	}
</style>
