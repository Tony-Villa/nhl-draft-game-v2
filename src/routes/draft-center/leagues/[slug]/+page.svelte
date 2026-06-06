<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import { buttonOptions } from '$lib/components/Button.options';
	import { page } from '$app/state';

	let { data, form } = $props();

	const inviteUrl = $derived(`${page.url.origin}/draft-center/leagues?invite=${data.league.inviteCode}`);
</script>

<svelte:head>
	<title>{data.league.name} | Hockey Draft Showdown</title>
</svelte:head>

<div class="mx-auto h-svh flex max-w-screen-xl flex-col gap-8 px-4 pb-16">
	<section class="border-[5px] border-black bg-white p-5 shadow-section-shadow md:p-8">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
			<div>
				<a href="/draft-center/leagues" class="mb-4 inline-block text-sm font-black uppercase underline">
					Back to leagues
				</a>
				<p class="mb-2 inline-block border-[3px] border-black bg-accent px-3 py-1 text-sm font-black uppercase">
					Private League
				</p>
				<h1 class="text-4xl font-black uppercase leading-none md:text-6xl">{data.league.name}</h1>
				{#if data.league.description}
					<p class="mt-4 max-w-2xl text-lg font-semibold text-gray-700">{data.league.description}</p>
				{/if}
			</div>

			<div class="min-w-0 border-[4px] border-black bg-white p-4">
				<p class="mb-2 text-sm font-black uppercase">Invite link</p>
				<div class="flex flex-col gap-3 sm:flex-row">
					<input readonly class="min-w-0 flex-1 border-[3px] border-black px-3 py-2 font-mono text-sm" value={inviteUrl} />
					<a class={buttonOptions({ variant: 'secondary', class: 'text-center' })} href={inviteUrl}>
						Open Invite
					</a>
				</div>
				<p class="mt-2 text-sm font-bold text-gray-600">Code: {data.league.inviteCode}</p>
			</div>
		</div>
	</section>

	<section class="grid gap-4 border-[5px] border-black bg-white p-5 shadow-section-shadow md:grid-cols-[1fr_auto] md:items-end">
		<div>
			<h2 class="text-2xl font-black uppercase">Your League Board</h2>
			<p class="mt-2 font-semibold text-gray-700">
				Choose which submitted draft board you want to use for this league.
			</p>
			{#if form?.setBoardError}
				<p class="mt-3 font-bold text-red-700">{form.setBoardError}</p>
			{/if}
		</div>
		<form method="post" action="?/setBoard" class="flex flex-col gap-3 sm:flex-row">
			<select name="draftBoardId" class="min-w-64 border-[3px] border-black bg-white px-3 py-2 font-bold">
				{#each data.boards as board}
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
	</section>

	<section class="flex flex-col gap-4">
		<div class="flex items-center justify-between gap-4">
			<h2 class="text-3xl font-black uppercase">League Leaderboard</h2>
			<a href="/draft-center/boards" class={buttonOptions({ variant: 'outline', size: 'sm' })}>Boards</a>
		</div>

		{#if data.leaderboard.length === 0}
			<div class="border-[4px] border-dashed border-black bg-white p-6 text-center font-bold">
				No members yet.
			</div>
		{:else}
			<div class="grid gap-3">
				{#each data.leaderboard as entry, index}
					<Card class="bg-white shadow-brut-shadow-sm">
						<div class="flex items-center gap-4">
							<div class="flex h-12 w-12 shrink-0 items-center justify-center border-[3px] border-black bg-accent text-xl font-black">
								{index + 1}
							</div>
							{#if entry.userAvatar}
								<img class="h-10 w-10 rounded-full border-[3px] border-black" src={entry.userAvatar} alt={entry.userName} />
							{/if}
							<div class="min-w-0 flex-1">
								<h3 class="truncate text-xl font-black">{entry.userName}</h3>
								<p class="text-sm font-bold uppercase text-gray-600">{entry.role}</p>
							</div>
							<div class="border-[3px] border-black bg-primary px-4 py-2 text-2xl font-black text-white">
								{entry.score || 0}
							</div>
						</div>
					</Card>
				{/each}
			</div>
		{/if}
	</section>
</div>
