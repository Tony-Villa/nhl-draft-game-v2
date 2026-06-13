<script lang="ts">
	import type { BoardSummary } from '$lib/boards/types';
	import Card from '$lib/components/Card.svelte';
	import { buttonOptions } from '$lib/components/Button.options';
	import type { LeagueStanding } from '$lib/leagues/types';
	import { getBoardSummaries } from '$lib/remote/boards.remote';
	import { editLeagueForm, getLeagueStandings, leaveLeagueForm } from '$lib/remote/leagues.remote';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { PendingForm } from '$lib/forms/pending-form.svelte';

	let { data, form } = $props();
	let league = $derived(data.league);

	const inviteUrl = $derived(`${page.url.origin}/draft-center/leagues?invite=${league.inviteCode}`);
	const boardsQuery = $derived(getBoardSummaries({ gameId: league.gameId }));
	const standingsQuery = $derived(getLeagueStandings({ slug: league.slug }));
	let editUnexpectedError = $state('');
	let leaveUnexpectedError = $state('');
	const pageActions = new PendingForm();

	const enhancedEditLeagueForm = editLeagueForm.enhance(async ({ submit }) => {
		editUnexpectedError = '';

		if (editLeagueForm.pending > 1) {
			return;
		}

		try {
			const succeeded = await submit();
			const result = editLeagueForm.result;

			if (succeeded && result) {
				league = {
					...league,
					name: result.name,
					description: result.description
				};
			}
		} catch {
			editUnexpectedError =
				'Unable to update league details right now. The previous details are still saved.';
		}
	});

	const enhancedLeaveLeagueForm = leaveLeagueForm.enhance(async ({ submit }) => {
		leaveUnexpectedError = '';

		if (leaveLeagueForm.pending > 1) {
			return;
		}

		if (!confirm('Leave this league? Your draft board will not be deleted.')) {
			return;
		}

		try {
			await submit();
		} catch {
			leaveUnexpectedError = 'Unable to leave this league right now. Your membership is unchanged.';
		}
	});

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
	<title>{league.name} | Hockey Draft Showdown</title>
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
				<h1 class="text-4xl leading-none font-black uppercase md:text-6xl">{league.name}</h1>
				{#if league.description}
					<p class="mt-4 max-w-2xl text-lg font-semibold text-gray-700">
						{league.description}
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
				<p class="mt-2 text-sm font-bold text-gray-600">Code: {league.inviteCode}</p>
			</div>
		</div>
	</section>

	{#if league.role === 'owner'}
		<section class="shadow-section-shadow border-[5px] border-black bg-white p-5">
			<h2 class="text-2xl font-black uppercase">Edit League</h2>
			<form {...enhancedEditLeagueForm} class="mt-4 grid gap-4">
				<input {...editLeagueForm.fields.slug.as('hidden', league.slug)} />
				<label class="flex flex-col gap-2 font-bold">
					<span class="uppercase">League name</span>
					<input
						{...editLeagueForm.fields.name.as('text')}
						value={league.name}
						maxlength="80"
						class="border-[3px] border-black px-3 py-2"
					/>
				</label>
				<label class="flex flex-col gap-2 font-bold">
					<span class="uppercase">Description</span>
					<textarea
						{...editLeagueForm.fields.description.as('text')}
						maxlength="500"
						class="min-h-28 border-[3px] border-black px-3 py-2"
						>{league.description || ''}</textarea
					>
				</label>
				<button
					class={buttonOptions({
						variant: 'primary',
						class: editLeagueForm.pending > 0 ? 'pending-control' : ''
					})}
					type="submit"
					disabled={editLeagueForm.pending > 0}
				>
					{editLeagueForm.pending > 0 ? 'Saving...' : 'Save League Details'}
				</button>
			</form>
			<div aria-live="polite">
				{#each editLeagueForm.fields.allIssues() as issue}
					<p class="mt-3 font-bold text-red-700">{issue.message}</p>
				{/each}
				{#if editUnexpectedError}
					<p class="mt-3 font-bold text-red-700">{editUnexpectedError}</p>
				{:else if editLeagueForm.result}
					<p class="mt-3 font-bold text-green-700">League details updated.</p>
				{/if}
			</div>
		</section>
	{/if}

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

	<section class="border-[4px] border-black bg-white p-5">
		<h2 class="text-2xl font-black uppercase">League Membership</h2>
		{#if league.role === 'owner'}
			<p class="mt-2 font-semibold text-gray-700">
				League owners cannot leave until ownership transfer is supported.
			</p>
		{:else}
			<p class="mt-2 font-semibold text-gray-700">
				Leaving removes you from this league but does not delete your draft board.
			</p>
			<form {...enhancedLeaveLeagueForm} class="mt-4">
				<input {...leaveLeagueForm.fields.slug.as('hidden', league.slug)} />
				<button
					class={buttonOptions({
						variant: 'danger',
						class: leaveLeagueForm.pending > 0 ? 'pending-control' : ''
					})}
					type="submit"
					disabled={leaveLeagueForm.pending > 0}
				>
					{leaveLeagueForm.pending > 0 ? 'Leaving...' : 'Leave League'}
				</button>
			</form>
			<div aria-live="polite">
				{#each leaveLeagueForm.fields.allIssues() as issue}
					<p class="mt-3 font-bold text-red-700">{issue.message}</p>
				{/each}
				{#if leaveUnexpectedError}
					<p class="mt-3 font-bold text-red-700">{leaveUnexpectedError}</p>
				{/if}
			</div>
		{/if}
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
			use:enhance={pageActions.enhance('set-board')}
			aria-busy={pageActions.is('set-board')}
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
			<button
				class={buttonOptions({
					variant: 'primary',
					class: pageActions.is('set-board') ? 'pending-control' : ''
				})}
				type="submit"
				disabled={pageActions.is('set-board')}
			>
				{pageActions.is('set-board') ? 'Updating Board...' : 'Use Board'}
			</button>
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
								width="40"
								height="40"
								loading="lazy"
								decoding="async"
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
