<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { type User } from '$lib/types';
	import HowToPlay from '../HowToPlay.svelte';
	import { page } from '$app/state';
	import { buttonOptions } from '../Button.options';
	import SignOutForm from '../SignOutForm.svelte';

	let {
		isAuthenticated,
		user,
		leaguesAndBoardsEnabled = false
	}: {
		isAuthenticated: boolean;
		user: User;
		leaguesAndBoardsEnabled?: boolean;
	} = $props();
</script>

<div
	class="mx-3 mb-8 grid flex-1 grid-cols-[1fr_auto_1fr] items-center border-b-8 py-3 pb-8 md:mx-10 md:flex-row"
>
	<HowToPlay />

	{#if page.url.pathname.includes('draft-center')}
		<div class="justify-self-center">
			<a href="/draft-center">
				<Header title="draft center" />
			</a>
		</div>
	{/if}

	<nav class="flex flex-row items-center justify-end gap-10 py-3">
		{#if isAuthenticated}
			<ul class="flex-end flex flex-row items-center gap-5">
				<div class="flex flex-row items-center gap-2">
					{#if user?.avatarUrl}
						<img
							class="h-8 w-8 rounded-full"
							src={user?.avatarUrl}
							alt={`${user?.name}'s avatar`}
							width="32"
							height="32"
							decoding="async"
						/>
					{/if}
					<p class="font-bold md:text-lg">Welcome, {user?.name}</p>
				</div>
				{#if leaguesAndBoardsEnabled}
					<a
						class={buttonOptions({
							variant: 'outline',
							size: 'sm',
							shadow: 'sm',
							class: `px-3 py-2 whitespace-nowrap ${page.url.pathname.startsWith('/draft-center/leagues') ? 'ring-accent ring-4 ring-offset-2' : ''}`
						})}
						href="/draft-center/leagues"
						aria-current={page.url.pathname.startsWith('/draft-center/leagues')
							? 'page'
							: undefined}
					>
						Leagues
					</a>
					<a
						class={buttonOptions({
							variant: 'secondary',
							size: 'sm',
							shadow: 'sm',
							class: `px-3 py-2 whitespace-nowrap ${page.url.pathname === '/draft-center/boards' ? 'ring-accent ring-4 ring-offset-2' : ''}`
						})}
						href="/draft-center/boards"
						aria-current={page.url.pathname === '/draft-center/boards' ? 'page' : undefined}
					>
						Boards
					</a>
				{/if}
				<SignOutForm />
			</ul>
		{:else}
			<ul class="flex-end flex flex-row items-center gap-5">
				<a class={`${buttonOptions({ variant: 'outline' })}`} href="/auth/login/google">
					Google Login
				</a>
				<a class={`${buttonOptions({ variant: 'secondary' })}`} href="/auth/login/discord">
					Discord Login
				</a>
			</ul>
		{/if}
	</nav>
</div>
