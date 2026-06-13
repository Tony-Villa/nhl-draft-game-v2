<script lang="ts">
	import Hamburger from '$lib/icons/Hamburger.svelte';
	import { buttonOptions } from '../Button.options';
	import HowToPlay from '../HowToPlay.svelte';
	import SignOutForm from '../SignOutForm.svelte';
	import { page } from '$app/state';

	let {
		isAuthenticated,
		leaguesAndBoardsEnabled = false
	}: {
		isAuthenticated: boolean;
		leaguesAndBoardsEnabled?: boolean;
	} = $props();
</script>

<nav class="z-50 flex justify-between px-3 pt-5">
	<HowToPlay />

	<div class="dropdown z-50">
		<Hamburger />
		<div
			class="dropdown-content shadow-button-shadow right-0 z-50 overflow-hidden border-2 border-black bg-white"
		>
			{#if isAuthenticated}
				<div>
					<ul class="flex flex-col gap-3">
						{#if leaguesAndBoardsEnabled}
							<li>
								<a
									class={buttonOptions({
										variant: 'outline',
										class: `block w-full text-center ${page.url.pathname.startsWith('/draft-center/leagues') ? 'ring-accent ring-4 ring-inset' : ''}`
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
										class: `block w-full text-center ${page.url.pathname === '/draft-center/boards' ? 'ring-accent ring-4 ring-inset' : ''}`
									})}
									href="/draft-center/boards"
									aria-current={page.url.pathname === '/draft-center/boards' ? 'page' : undefined}
								>
									Boards
								</a>
							</li>
						{/if}
						<SignOutForm class="w-full" buttonClass="w-full" />
					</ul>
				</div>
			{:else}
				<div class="flex flex-col gap-4 bg-[#FFF4E8]">
					<a
						class={`${buttonOptions({ variant: 'outline', class: 'justify-self-center' })}`}
						href="/auth/login/google"
					>
						Google Login
					</a>
					<a class={`${buttonOptions({ variant: 'secondary' })}`} href="/auth/login/discord">
						Discord Login
					</a>
				</div>
			{/if}
		</div>
	</div>
</nav>

<style>
	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		min-width: 200px;
		padding: 20px;
		z-index: 1;
	}

	.dropdown:hover .dropdown-content {
		display: block;
	}
</style>
