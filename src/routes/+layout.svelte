<script lang="ts">
	import '../app.pcss';
	import '../app.pcss';
	import { setDraftSystem } from '$lib/globalState/prospects/prospectsState.svelte';
	import '../app.pcss';
	import '../tailwind.css';
	import { setCurrentUser } from '$lib/globalState/user/userState.svelte';

	let { children, data }: {
		children: any;
		data: any;
	} = $props();

	const draftSystem = setDraftSystem(data.prospects, data.draftBoard);
	const currentUser = setCurrentUser(data?.user?.user);
</script>

<svelte:head>
	<title>Draft Center</title>
</svelte:head>

<main class="bg-[#FFF4E8] font-medium">
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
