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
	class="mx-6 mb-8 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 border-b-8 border-b-primary py-3 pb-6 xl:mx-10 xl:gap-8"
>
	<HowToPlay />

	{#if page.url.pathname.includes('draft-center')}
		<div class="min-w-0 justify-self-center [&_h1]:text-4xl xl:[&_h1]:text-5xl 2xl:[&_h1]:text-6xl">
			<a href="/draft-center">
				<Header title="draft center" />
			</a>
		</div>
	{/if}

	<nav class="min-w-0 justify-self-end py-3">
		{#if isAuthenticated}
			<ul class="flex flex-row items-center justify-end gap-2 xl:gap-3">
				<li class="hidden min-w-0 items-center gap-2 xl:flex">
					{#if user?.avatarUrl}
						<img
							class="h-8 w-8 shrink-0 rounded-full border-2 border-black"
							src={user?.avatarUrl}
							alt={`${user?.name}'s avatar`}
							width="32"
							height="32"
							decoding="async"
						/>
					{/if}
					<p class="max-w-32 truncate text-sm font-bold" title={user?.name}>
						{user?.name}
					</p>
				</li>
				{#if leaguesAndBoardsEnabled}
					<li>
						<a
							class={buttonOptions({
								variant: 'outline',
								size: 'sm',
								shadow: 'sm',
								class: `px-2.5 py-2 whitespace-nowrap ${page.url.pathname.startsWith('/draft-center/leagues') ? 'ring-accent ring-4 ring-offset-2' : ''}`
							})}
							href="/draft-center/leagues"
							aria-current={page.url.pathname.startsWith('/draft-center/leagues')
								? 'page'
								: undefined}
						>
							Leagues
						</a>
					</li>
					<li>
						<a
							class={buttonOptions({
								variant: 'secondary',
								size: 'sm',
								shadow: 'sm',
								class: `px-2.5 py-2 whitespace-nowrap ${page.url.pathname === '/draft-center/boards' ? 'ring-accent ring-4 ring-offset-2' : ''}`
							})}
							href="/draft-center/boards"
							aria-current={page.url.pathname === '/draft-center/boards' ? 'page' : undefined}
						>
							Boards
						</a>
					</li>
				{/if}
				<li><SignOutForm /></li>
			</ul>
		{:else}
			<ul class="flex flex-row items-center justify-end gap-3">
				<li>
					<a class={`${buttonOptions({ variant: 'outline' })}`} href="/auth/login/google">
						Google Login
					</a>
				</li>
				<li>
					<a class={`${buttonOptions({ variant: 'secondary' })}`} href="/auth/login/discord">
						Discord Login
					</a>
				</li>
			</ul>
		{/if}
	</nav>
</div>
