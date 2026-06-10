<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import { buttonOptions } from '$lib/components/Button.options';
	import { joinLeagueForm } from '$lib/remote/leagues.remote';

	let { data, form } = $props();
	let joinUnexpectedError = $state('');

	const enhancedJoinLeagueForm = joinLeagueForm.enhance(async ({ submit }) => {
		joinUnexpectedError = '';

		if (joinLeagueForm.pending > 1) {
			return;
		}

		try {
			await submit();
		} catch {
			joinUnexpectedError = 'Unable to join this league right now. No membership was changed.';
		}
	});
</script>

<svelte:head>
	<title>Leagues | Hockey Draft Showdown</title>
</svelte:head>

<div class="mx-auto h-screen flex max-w-screen-xl flex-col gap-8 px-4 pb-16">
	<section class="grid gap-6 border-[5px] border-black bg-white p-5 shadow-section-shadow md:grid-cols-[1.2fr_0.8fr] md:p-8">
		<div class="flex flex-col justify-between gap-6">
			<div>
				<p class="mb-2 inline-block border-[3px] border-black bg-primary px-3 py-1 text-sm font-black uppercase text-black">
					Private Leagues
				</p>
				<h1 class="text-4xl font-black uppercase leading-none md:text-6xl">Compete with your crew</h1>
			</div>
			<p class="max-w-2xl text-lg font-semibold text-gray-700">
				Use your submitted draft board in private leaderboards for friends, group chats, and office bragging rights.
			</p>
		</div>

		<div class="grid content-start gap-4">
			<form {...enhancedJoinLeagueForm} class="border-[4px] border-black bg-accent p-4">
				<label for="inviteCode" class="mb-2 block text-sm font-black uppercase">Join with invite code</label>
				<div class="flex flex-col gap-3 sm:flex-row">
					<input
						{...joinLeagueForm.fields.inviteCode.as('text')}
						id="inviteCode"
						value={form?.inviteCode || data.inviteCode}
						class="min-w-0 flex-1 border-[3px] border-black px-3 py-2 font-bold uppercase"
						placeholder="ABC123XY"
					/>
					<button
						class={buttonOptions({ variant: 'primary', class: 'whitespace-nowrap' })}
						type="submit"
						disabled={joinLeagueForm.pending > 0}
					>
						{joinLeagueForm.pending > 0 ? 'Joining...' : 'Join League'}
					</button>
				</div>
				<div aria-live="polite">
					{#each joinLeagueForm.fields.allIssues() as issue}
						<p class="mt-3 font-bold text-red-700">{issue.message}</p>
					{/each}
					{#if joinUnexpectedError}
						<p class="mt-3 font-bold text-red-700">{joinUnexpectedError}</p>
					{/if}
				</div>
				{#if form?.joinError}
					<p class="mt-3 font-bold text-red-700">{form.joinError}</p>
				{/if}
			</form>
		</div>
	</section>

	<section class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
		<form method="post" action="?/create" class="flex flex-col gap-4 border-[5px] border-black bg-white p-5 shadow-section-shadow">
			<h2 class="text-2xl font-black uppercase">Create a League</h2>
			<label class="flex flex-col gap-2 font-bold">
				<span class="uppercase">League name</span>
				<input
					name="name"
					value={form?.name || ''}
					class="border-[3px] border-black px-3 py-2"
					placeholder="Duck's Draft Room"
				/>
			</label>
			<label class="flex flex-col gap-2 font-bold">
				<span class="uppercase">Description</span>
				<textarea
					name="description"
					class="min-h-28 border-[3px] border-black px-3 py-2"
					placeholder="Optional"
				>{form?.description || ''}</textarea>
			</label>
			{#if form?.createError}
				<p class="font-bold text-red-700">{form.createError}</p>
			{/if}
			<button class={buttonOptions({ variant: 'primary', size: 'lg' })} type="submit">
				Create League
			</button>
		</form>

		<div class="flex flex-col gap-4">
			<div class="flex items-end justify-between gap-4">
				<h2 class="text-3xl font-black uppercase">My Leagues</h2>
			<a href="/draft-center/boards" class={buttonOptions({ variant: 'outline', size: 'sm' })}>Boards</a>
			</div>

			{#if data.leagues.length === 0}
				<div class="border-[4px] border-dashed border-black bg-white p-6 text-center font-bold">
					No leagues yet. Create one or join with an invite code.
				</div>
			{:else}
				<div class="grid gap-4">
					{#each data.leagues as league}
						<Card class="bg-white shadow-brut-shadow-sm">
							<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
								<div>
									<h3 class="text-2xl font-black">{league.name}</h3>
									<p class="font-semibold text-gray-700">
										{league.memberCount} member{league.memberCount === 1 ? '' : 's'} • {league.role}
									</p>
									{#if league.description}
										<p class="mt-1 text-sm font-semibold text-gray-600">{league.description}</p>
									{/if}
								</div>
								<div class="flex items-center gap-3">
									<div class="border-[3px] border-black bg-primary px-3 py-2 text-center font-black text-white">
										{league.score || 0}
									</div>
									<a class={buttonOptions({ variant: 'secondary' })} href={`/draft-center/leagues/${league.slug}`}>
										Open
									</a>
								</div>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>
