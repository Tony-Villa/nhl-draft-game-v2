<script lang="ts">
	import type { BoardSummary } from '$lib/boards/types';
	import Card from '$lib/components/Card.svelte';
	import { buttonOptions } from '$lib/components/Button.options';
	import type { LeagueStanding } from '$lib/leagues/types';
	import { getBoardSummaries } from '$lib/remote/boards.remote';
	import { getLeagueStandings } from '$lib/remote/leagues.remote';
	import { page } from '$app/state';

	let { data, form } = $props();

	const inviteUrl = $derived(
		`${page.url.origin}/draft-center/leagues?invite=${data.league.inviteCode}`
	);
	const boardsQuery = $derived(getBoardSummaries({ gameId: data.league.gameId }));
	const standingsQuery = $derived(getLeagueStandings({ slug: data.league.slug }));

	function retryBoards(reset: () => void) {
		void boardsQuery.refresh();
		reset();
	}

	function retryStandings(reset: () => void) {
		void standingsQuery.refresh();
		reset();
	}
</script>

<svelte:head>
	<title>{data.league.name} | Hockey Draft Showdown</title>
</svelte:head>

<div class="mx-auto flex h-svh max-w-screen-xl flex-col gap-8 px-4 pb-16">
	<section class="shadow-section-shadow border-[5px] border-black bg-white p-5 md:p-8">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<a
					href="/draft-center/leagues"
					class="mb-4 inline-block text-sm font-black uppercase underline"
				>
					Back to leagues
				</a>
				<p
					class="bg-accent mb-2 inline-block border-[3px] border-black px-3 py-1 text-sm font-black uppercase"
				>
					Private League
				</p>
				<h1 class="text-4xl leading-none font-black uppercase md:text-6xl">{data.league.name}</h1>
				{#if data.league.description}
					<p class="mt-4 max-w-2xl text-lg font-semibold text-gray-700">
						{data.league.description}
					</p>
				{/if}
			</div>

			<div class="min-w-0 border-[4px] border-black bg-white p-4">
				<p class="mb-2 text-sm font-black uppercase">Invite link</p>
				<div class="flex flex-col gap-3 sm:flex-row">
					<input
						readonly
						class="min-w-0 flex-1 border-[3px] border-black px-3 py-2 font-mono text-sm"
						value={inviteUrl}
					/>
					<a class={buttonOptions({ variant: 'secondary', class: 'text-center' })} href={inviteUrl}>
						Open Invite
					</a>
				</div>
				<p class="mt-2 text-sm font-bold text-gray-600">Code: {data.league.inviteCode}</p>
			</div>
		</div>
	</section>

	<section class="shadow-section-shadow border-[5px] border-black bg-white p-5">
		<div>
			<h2 class="text-2xl font-black uppercase">Your League Board</h2>
			<p class="mt-2 font-semibold text-gray-700">
				Choose which submitted draft board you want to use for this league.
			</p>
			{#if form?.setBoardError}
				<p class="mt-3 font-bold text-red-700">{form.setBoardError}</p>
			{/if}
		</div>

		<div class="mt-4">
			<svelte:boundary>
				{@render boardSelector(await boardsQuery)}

				{#snippet pending()}
					<div class="flex flex-col gap-3 sm:flex-row" data-league-boards-state="loading">
						<div class="h-11 min-w-64 animate-pulse border-[3px] border-black bg-gray-200"></div>
						<div class="h-11 w-28 animate-pulse border-[3px] border-black bg-gray-300"></div>
					</div>
				{/snippet}

				{#snippet failed(error, reset)}
					<div class="border-[3px] border-black bg-red-100 p-4" data-league-boards-state="error">
						<p class="font-black">Unable to load your draft boards.</p>
						<p class="mt-1 text-sm font-semibold">Your league board has not changed.</p>
						<button
							type="button"
							class={buttonOptions({ variant: 'outline', size: 'sm', class: 'mt-3' })}
							onclick={() => retryBoards(reset)}
						>
							Try Again
						</button>
					</div>
				{/snippet}
			</svelte:boundary>
		</div>
	</section>

	<section class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<h2 class="text-3xl font-black uppercase">League Leaderboard</h2>
			<a href="/draft-center/boards" class={buttonOptions({ variant: 'outline', size: 'sm' })}
				>Boards</a
			>
		</div>

		<svelte:boundary>
			{@render standings(await standingsQuery)}

			{#snippet pending()}
				<div class="grid gap-3" data-league-standings-state="loading">
					{#each Array(3) as _}
						<div class="h-20 animate-pulse border-[4px] border-black bg-gray-200"></div>
					{/each}
				</div>
			{/snippet}

			{#snippet failed(error, reset)}
				<div
					class="border-[4px] border-black bg-red-100 p-6 text-center"
					data-league-standings-state="error"
				>
					<p class="font-black">Unable to load league standings.</p>
					<p class="mt-1 text-sm font-semibold">No board or league data was changed.</p>
					<button
						type="button"
						class={buttonOptions({ variant: 'outline', size: 'sm', class: 'mt-3' })}
						onclick={() => retryStandings(reset)}
					>
						Try Again
					</button>
				</div>
			{/snippet}
		</svelte:boundary>
	</section>
</div>

{#snippet boardSelector(boards: BoardSummary[])}
	{#if boards.length === 0}
		<div
			class="border-[4px] border-dashed border-black bg-white p-5 font-bold"
			data-league-boards-state="empty"
		>
			No draft boards are available. <a class="underline" href="/draft-center/boards"
				>Manage boards</a
			>
		</div>
	{:else}
		<form
			method="post"
			action="?/setBoard"
			class="flex flex-col gap-3 sm:flex-row"
			data-league-boards-state="populated"
		>
			<select
				name="draftBoardId"
				class="min-w-64 border-[3px] border-black bg-white px-3 py-2 font-bold"
			>
				{#each boards as board}
					<option
						value={board.id}
						selected={board.id === data.league.selectedDraftBoardId}
						disabled={board.status !== 'submitted'}
					>
						{board.name} ({board.status})
					</option>
				{/each}
			</select>
			<button class={buttonOptions({ variant: 'primary' })} type="submit">Use Board</button>
			<a class={buttonOptions({ variant: 'outline' })} href="/draft-center/boards">Manage</a>
		</form>
	{/if}
{/snippet}

{#snippet standings(entries: LeagueStanding[])}
	{#if entries.length === 0}
		<div
			class="border-[4px] border-dashed border-black bg-white p-6 text-center font-bold"
			data-league-standings-state="empty"
		>
			No members yet.
		</div>
	{:else}
		<div class="grid gap-3" data-league-standings-state="populated">
			{#each entries as entry, index}
				<Card class="shadow-brut-shadow-sm bg-white">
					<div class="flex items-center gap-4">
						<div
							class="bg-accent flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-black text-xl font-black"
						>
							{index + 1}
						</div>
						{#if entry.userAvatar}
							<img
								class="h-10 w-10 rounded-full border-[3px] border-black"
								src={entry.userAvatar}
								alt={entry.userName || 'League member'}
							/>
						{/if}
						<div class="min-w-0 flex-1">
							<h3 class="truncate text-xl font-black">{entry.userName || 'Anonymous member'}</h3>
							<p class="text-sm font-bold text-gray-600 uppercase">{entry.role}</p>
						</div>
						<div
							class="bg-primary border-[3px] border-black px-4 py-2 text-2xl font-black text-white"
						>
							{entry.score || 0}
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
{/snippet}
