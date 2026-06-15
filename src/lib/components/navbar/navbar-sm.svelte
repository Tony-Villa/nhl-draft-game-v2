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

	let menuOpen = $state(false);
	let menuElement = $state<HTMLDivElement>();

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	function handleWindowClick(event: MouseEvent) {
		if (event.target instanceof Node && menuElement?.contains(event.target)) {
			return;
		}

		closeMenu();
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeMenu();
		}
	}
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<nav class="z-50 flex justify-between px-3 pt-5">
	<HowToPlay />

	<div class="relative z-50">
		<button
			type="button"
			class="shadow-button-shadow hover:bg-accent flex h-[50px] w-[50px] items-center justify-center border-[3px] border-black bg-white transition-colors active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
			aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
			aria-expanded={menuOpen}
			aria-controls="mobile-navigation-menu"
			onclick={toggleMenu}
		>
			<Hamburger open={menuOpen} />
		</button>

		{#if menuOpen}
			<div
				bind:this={menuElement}
				id="mobile-navigation-menu"
				class="shadow-button-shadow absolute top-[calc(100%+0.75rem)] right-0 z-50 min-w-56 border-[3px] border-black bg-[#FFF4E8] p-4"
			>
				{#if isAuthenticated}
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
									onclick={closeMenu}
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
									onclick={closeMenu}
								>
									Boards
								</a>
							</li>
						{/if}
						<li><SignOutForm class="w-full" buttonClass="w-full" /></li>
					</ul>
				{:else}
					<ul class="flex flex-col gap-4">
						<li>
							<a
								class={`${buttonOptions({ variant: 'outline', class: 'block w-full text-center' })}`}
								href="/auth/login/google"
								onclick={closeMenu}
							>
								Google Login
							</a>
						</li>
						<li>
							<a
								class={`${buttonOptions({ variant: 'secondary', class: 'block w-full text-center' })}`}
								href="/auth/login/discord"
								onclick={closeMenu}
							>
								Discord Login
							</a>
						</li>
					</ul>
				{/if}
			</div>
		{/if}
	</div>
</nav>
