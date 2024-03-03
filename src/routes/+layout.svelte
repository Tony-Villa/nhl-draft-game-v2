<script lang="ts">
	import { setDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import '../app.pcss';

	let { children, data } = $props<{
		children: any;
		data: any;
	}>();

	const draftSystem = setDraftSystem(data.prospects, data.draftBoard);

	console.log(data?.user);
</script>

<svelte:head>
	<title>Draft Center</title>
</svelte:head>

<main>
	{#if data.isAuthenticated}
		<nav>
			<ul>
				<form method="post" action="/draft-center?/logout">
					<button>Sign out</button>
				</form>
			</ul>
		</nav>
	{:else}
		<nav>
			<ul>
				<li>
					<a href="/auth/login">Sign in</a>
				</li>
				<li>
					<a href="/auth/register">Sign up</a>
				</li>
			</ul>
		</nav>
	{/if}
	{@render children()}
</main>
