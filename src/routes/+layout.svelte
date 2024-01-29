<script lang="ts">
	import { setDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import '../app.pcss';

	let { children, data } = $props();

	const draftSystem = setDraftSystem(data.prospects, data.draftBoard);
</script>

<svelte:head>
	<title>Draft Center</title>
</svelte:head>

<main>
	{#if data.isAuthenticated}
		<nav>
			<ul>
				<li>
					<a href="/api/auth/logout">Sign out</a>
				</li>
			</ul>
		</nav>
	{:else}
		<nav>
			<ul>
				<li>
					<a href="/api/auth/login">Sign in</a>
				</li>
				<li>
					<a href="/api/auth/register">Sign up</a>
				</li>
			</ul>
		</nav>
	{/if}
	{@render children()}
</main>
